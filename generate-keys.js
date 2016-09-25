const Keygrip = require('keygrip');

/** Returns a promise that generates a new largish ASCII random key */
function makeKey() {
  return new Promise(function (resolve, reject) {
    require('crypto').randomBytes(48, function(err, buf) {
      if (err) {
        reject(err);
        return;
      }
      resolve(buf.toString('base64'));
    });
  });
}

let keygrip;
exports.initKeys = function (db) {
  let c = db.collection("keys");
  return c.find({}).then((rows) => {
    if (! rows.length) {
      let gen;
      return makeKey().then((key) => {
        gen = key;
        return c.insert({key});
      }).then(() => {
        return [{key: gen}];
      });
    } else {
      return rows;
    }
  }).then((keys) => {
    keys = keys.map((i) => i.key);
    keys.reverse();
    keygrip = new Keygrip(keys);
  });
}

exports.getKeys = function () {
  return keygrip;
};
