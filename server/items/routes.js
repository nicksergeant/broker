'use strict';

var _ = require('underscore');
var db = require('../db');
var request = require('request');
var uuid = require('node-uuid');
var r = require('rethinkdb');

exports.exportItems = function() {
  return function(req, res, next) {
    var items = JSON.parse(req.body.items);
    if ((req.customer.users && req.customer.users.loginRequired && !req.user) || !req.customer.items.exportable) {
      return res.send(403);
    }
    var query = r.table('items_' + req.customer.name);
    query = query.getAll.apply(query, items);
    query.pluck(req.body.fields)
      .run(db.conn).then(function(items) {
        items.toArray(function(err, items) {
          if (err) return db.handleError(err, res);
          res.attachment('export.csv');
          var csv = req.body.fields.join(',');
          var newItems = [];
          var commaRegExp = new RegExp(',', 'gi');
          items.forEach(function(item) {
            var newItem = [];
            req.body.fields.forEach(function(field) {
              newItem.push(item[field].replace(commaRegExp, '') || 'false');
            });
            newItem = newItem.join(',');
            newItems.push(newItem);
            console.log(newItem);
          });
          newItems = newItems.join('\n');
          csv += '\n' + newItems;
          res.send(csv);
        });
    }).error(function(err) { db.handleError(err, res); });
  };
};
exports.get = function() {
  return function(req, res, next) {
    if (req.customer.users && req.customer.users.loginRequired && !req.user) {
      return res.send(403);
    }
    if (req.query.field) {
      var fields = {};
      fields[req.query.field] = req.params.id;
      r.table('items_' + req.customer.name)
        .filter(fields)
        .run(db.conn).then(function(items) {
          items.toArray(function(err, items) {
            if (err) return db.handleError(err, res);
            items.length ? res.send(items[0]) : res.send(404);
          });
        }).error(function(err) { db.handleError(err, res); });
    } else {
      r.table('items_' + req.customer.name)
        .get(req.params.id)
        .run(db.conn).then(function(item) {
          item ? res.json(item) : res.send(404);
        }).error(function(err) { db.handleError(err, res); });
    }
  };
};
exports.list = function() {
  return function(req, res, next) {
    if (req.customer.users && req.customer.users.loginRequired && !req.user) {
      return res.send(403);
    }
    if (req.customer.feed && typeof(req.customer.feed) === 'string') {
      var feedUrl;
      if (req.customer.feed.indexOf('{{ slug }}') !== -1) {
        feedUrl = req.customer.feed.replace('{{ slug }}', req.host.split('.')[0]);
      } else {
        feedUrl = req.customer.feed;
      }
      return request(feedUrl, function (err, response, body) {
        if (err) {
          res.send(500);
        } else {
          var items;
          if (req.customer.feedArray) {
            items = JSON.parse(body)[req.customer.feedArray];
            if (req.customer.items && req.customer.items.nullToString) {
              items.forEach(function(item) {
                Object.keys(item).forEach(function(key) {
                  if (item[key] === null) {
                    item[key] = '';
                  }
                });
              });
            }
            res.send(items);
          } else {
            items = JSON.parse(body);
            items.forEach(function(item) {
              if (!item.id) {
                item.id = uuid.v4();
              }
            });
            res.send(items);
          }
        }
      });
    }
    var query = r.table('items_' + req.customer.name);
    if (req.customer.fields) {
      query = query.pluck(req.customer.fields);
    }
    query.run(db.conn).then(function(items) {
      items.toArray(function(err, items) {
        if (err) return db.handleError(err, res);
        res.send(items);
      });
    }).error(function(err) { db.handleError(err, res); });
  };
};
exports.search = function() {
  return function(req, res, next) {
    if (req.customer.users && req.customer.users.loginRequired && !req.user) {
      return res.send(403);
    }
    if (!req.query.q || req.query.q && req.query.q.length <= 1) {
      return res.send(404);
    }
    if (req.customer.backendSearchURL) {
      request(req.customer.backendSearchURL + '&q=' + req.query.q, function (err, response, body) {
        if (err) {
          res.send(500);
        } else {
          var items = JSON.parse(body)[req.customer.backendSearchArray] || [];
          items.forEach(function(item) {
            if (!item.id) {
              item.id = uuid.v4();
            }
          });
          res.send(items);
        }
      });
    } else {

      var query = r.table('items_' + req.customer.name);

      var conditions;
      req.customer.searchFields.forEach(function(field) {
        console.log(field, req.query.q);
        var condition = r.row(field).match('(?i)' + req.query.q);
        if (conditions) {
          conditions = conditions.or(condition);
        } else {
          conditions = condition;
        }
      });

      query = query.filter(conditions);
      
      if (req.customer.fields) {
        query = query.pluck(req.customer.fields);
      }

      query.run(db.conn).then(function(items) {
        items.toArray(function(err, items) {
          if (err) return db.handleError(err, res);
          res.send(items);
        });
      }).error(function(err) { db.handleError(err, res); });
    }
  };
};
