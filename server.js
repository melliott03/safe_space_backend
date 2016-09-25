const express = require("express");
const bodyParser = require('body-parser');
const { getKeys, initKeys } = require("./generate-keys");
const { Login, Event, EventResponse, LocationPing } = require("./model");

let db = require('mongodb-promises').db("localhost:27017", "safespace");

initKeys(db).catch((err) => {
  console.error("Could not initialize:", err);
  process.exit(2);
});

const app = express();

app.set('trust proxy', true);
// Disable x-powered-by header
app.disable("x-powered-by");
app.use(bodyParser.json({limit: '10mb'}));

app.use((req, res, next) => {
  if (req.body && req.body.token) {
    let parts = req.body.token.split(":");
    let hash = parts[0];
    let deviceId = parts[1];
    if (getKeys().verify(deviceId, hash)) {
      req.deviceId = deviceId;
      next();
    } else {
      res.status(401).send("Error: bad token");
    }
  }
});

app.post("/api/login", (req, res) => {
  let deviceId = req.body.deviceId;
  let secret = req.body.secret;
  Login.find({
    _id: deviceId
  }).then((rows) => {
    console.log("start", deviceId, secret, rows);
    if (! rows.length) {
      let login = new Login({_id: deviceId, secret});
      return login.save();
    }
    return true;
  }).then(() => {
    let token = getKeys().sign(deviceId);
    token = `${token}:${deviceId}`;
    res.send({token});
  }).catch(catcher(res));
});

app.post("/api/location-ping", requireAuth((req, res) => {
  LocationPing.findOneAndUpdate(
    {_id: req.deviceId},
    {location: req.body.location},
    {upsert: true}
  ).then(() => {
    res.send("OK");
  }).catch(catcher(res));
}));

app.post("/api/event/:eventId", requireAuth((req, res) => {
  let result;
  Event.find({
    _id: req.params.eventId
  }).then((events) => {
    if (! events.length) {
      // New event
      let event = new Event({
        _id: req.params.eventId,
        deviceId: req.deviceId,
        location: req.body.location,
        requestWitnesses: req.body.requestWitnesses,
        done: req.body.done
      });
      result = event;
      return event.save();
    } else {
      if (events[0].deviceId != req.deviceId) {
        res.status(401).send("Not authorized");
        return;
      }
      let updates = trimObject(req.body, ["location", "requestWitnesses", "done"]);
      Object.assign(events[0], updates);
      result = events[0].toObject();
      return Event.update(
        {_id: req.params.eventId},
        {$set: updates});
    }
  }).then(() => {
    res.send(result);
  }).catch(catcher(res));
}));

app.post("/api/begin-event", (req, res) => {
  let c = db.collection("events");
  let event = {
    _id: req.body.id,
    userId: req.userId,
    location: req.body.location
  };
  c.insert(event).then(() => {
    res.send("OK");
  }).catch(catcher(res));
});

app.post("/api/request-witness", (req, res) => {
  let c = db.collection("requests");
  c.insert({
    _id: req.body.eventId,
    asked: Date.now(),
    responders: []
  }).then(() => {
    requestNearbyPeople(req.body.eventId);
  }).catch(catcher(res));
});

app.post("/api/unrequest-witness", (req, res) => {
  let c = db.collection("requests");
  let responseColl = db.collection("request-responses");
  c.delete({_id: req.body.eventId}).then(() => {
    return responseColl.find({
      eventId: req.body.eventId
    });
  }).then((docs) => {
    cancelPeopleRequests(docs);
    return responseColl.remove({
      eventId: req.body.eventId
    });
  }).then(() => {
    res.send("OK");
  }).catch(catcher(res));
});

app.post("/api/on-the-way", (req, res) => {
  let c = db.collection("request-responses");
  c.insert({
    eventId: req.body.eventId,
    responderId: req.body.responderId,
    location: req.body.location
  }).then(() => {
    res.send("OK");
  }).catch(catcher(res));
});

app.post("/api/arrived", (req, res) => {
  let c = db.collection("request-responses");
  c.update({
    eventId: req.body.eventId,
    responderId: req.body.responderId
  }, {
    $set: {arrived: true}
  }).then(() => {
    res.send("OK");
  }).catch(catcher(res));
});

app.post("/api/set-profile", (req, res) => {
  let c = db.collection("profiles");
  c.update({
    _id: req.body.id
  }, {
    $set: {profile: req.body.profile}
  }, {
    upsert: true
  }).then(() => {
    res.send("OK");
  }).catch(catcher(res));
});

function catcher(res) {
  return (error) => {
    console.error("Error:", error, error.stack);
    res.status(500).send(`Error: ${error}\n${error.stack}`);
  };
}

function requireAuth(func) {
  return function (req, res) {
    if (! req.deviceId) {
      res.status(401).send("Authentication required");
    } else {
      func(req, res);
    }
  };
}

function trimObject(obj, attrs) {
  // Returns an object with no attrs other than those listed, and only attributes that are defined and not null
  let result = {};
  for (let a of attrs) {
    if (obj[a] != null) {
      result[a] = obj[a];
    }
  }
  return result;
}

function requestNearbyPeople(eventId) {
}

function cancelPeopleRequests(requests) {
}

console.log("Listening on http://localhost:8080");
app.listen(8080);
