'use strict';

var db = require('../db');
var r = require('rethinkdb');

exports.lastActive = function() {
  return function(req, res, next) {
    if (req.user) {
      r.table('users_' + req.customer.name)
        .get(req.user.id)
        .update({ lastActive: new Date().toISOString() })
        .run(db.conn)
        .error(function(err) { db.handleError(err, res); });
    }
    next();
  };
};
