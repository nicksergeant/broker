'use strict';

var db = require('../db');
var r = require('rethinkdb');

exports.list = function() {
  return function(req, res, next) {
    if (!req.user || !req.user.isAdmin) return res.send(404);
    r.table('events_' + req.customer.name)
      .merge(function(event) {
        return event.merge({
          'user': r.table('users_' + req.customer.name).get(event('user_id'))
        });
      })
      .run(db.conn).then(function(events) {
        events.toArray(function(err, events) {
          if (err) return db.handleError(err, res);
          events.forEach(function(ev) {
            if (ev.user) { delete ev.user.password; }
          });
          events.length ? res.send(events) : res.send([]);
        });
      }).error(function(err) { db.handleError(err, res); });
  };
};
exports.create = function() {
  return function(req, res, next) {
    req.body.user_id = req.user ? req.user.id : req.session.anonymousId;
    req.body.created = new Date().toISOString();
    r.table('events_' + req.customer.name)
      .insert(req.body, { returnChanges: true })
      .run(db.conn).then(function(result) {
        if (result.inserted === 1) {
          res.send(result.changes[0].new_val);
        } else {
          res.send(500);
        }
      }).error(function(err) { db.handleError(err, res); });
  };
};
exports.getForUser = function() {
  return function(req, res, next) {
    if (!req.user || !req.user.isAdmin) return res.send(404);
    r.table('events_' + req.customer.name)
      .filter({ user_id: req.params.id })
      .run(db.conn).then(function(events) {
        events.toArray(function(err, events) {
          if (err) return db.handleError(err, res);
          res.send(events);
        });
      }).error(function(err) { db.handleError(err, res); });
  };
};
