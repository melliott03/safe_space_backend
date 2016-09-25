const mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost:27017/safespace');

exports.Login = mongoose.model(
  "Login",
  mongoose.Schema({
    _id: String, // deviceId
    secret: String
  }));

exports.Event = mongoose.model(
  "Event",
  mongoose.Schema({
    _id: String, // eventId
    deviceId: String,
    location: Object,
    requestWitnesses: Boolean,
    done: Boolean
  }));

exports.EventResponse = mongoose.model(
  "EventResponse",
  mongoose.Schema({
    eventId: String,
    deviceId: String,
    location: Object,
    arrived: Boolean,
    filming: Boolean,
    done: Boolean
  }));

exports.LocationPing = mongoose.model(
  "LocationPing",
  mongoose.Schema({
    _id: String, // deviceId
    location: Object
  }));
