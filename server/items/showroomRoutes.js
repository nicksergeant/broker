'use strict';

var db = require('../db');
var r = require('rethinkdb');

// Styles.
exports.colorsList = function() {
  return function(req, res, next) {
    if (req.customer.name !== 'showroom') { return res.send(404); }
    r.table('items_showroom_colors')
      .get(parseInt(req.params.id))
      .run(db.conn).then(function(item) {
        res.send(item ? item : 404);
      }).error(function(err) { db.handleError(err, res); });
  };
};
exports.optionsList = function() {
  return function(req, res, next) {
    if (req.customer.name !== 'showroom') { return res.send(404); }
    r.table('items_showroom_options')
      .get(parseInt(req.params.id))
      .run(db.conn).then(function(item) {
        res.send(item ? item : 404);
      }).error(function(err) { db.handleError(err, res); });
  };
};
exports.photosList = function() {
  return function(req, res, next) {
    if (req.customer.name !== 'showroom') { return res.send(404); }
    r.table('items_showroom_photos')
      .get(parseInt(req.params.id))
      .run(db.conn).then(function(item) {
        res.send(item ? item : 404);
      }).error(function(err) { db.handleError(err, res); });
  };
};
exports.tmv = function() {
  return function(req, res, next) {
    if (req.customer.name !== 'showroom') { return res.send(404); }
    r.table('items_showroom_tmv')
      .get(parseInt(req.params.id))
      .run(db.conn).then(function(item) {
        res.send(item ? item : 404);
      }).error(function(err) { db.handleError(err, res); });
  };
};

// Items.
exports.fuelPhotosList = function() {
  return function(req, res, next) {
    if (req.customer.name !== 'showroom') { return res.send(404); }
    r.table('items_showroom_fuelphotos')
      .getAll(req.params.id, { index: 'model_id' })
      .run(db.conn).then(function(items) {
        items.toArray(function(err, items) {
          if (err) return db.handleError(err, res);
          if (!items.length) { return res.send(404); }
          res.send({
            id: req.params.id,
            fuelphotos: items
          });
        });
      }).error(function(err) { db.handleError(err, res); });
  };
};
exports.stylesList = function() {
  return function(req, res, next) {
    if (req.customer.name !== 'showroom') { return res.send(404); }
    r.table('items_showroom_styles')
      .getAll(req.params.id, { index: 'model_id' })
      .run(db.conn).then(function(items) {
        items.toArray(function(err, items) {
          if (err) return db.handleError(err, res);
          res.send(items.length ? items : 404);
        });
      }).error(function(err) { db.handleError(err, res); });
  };
};
