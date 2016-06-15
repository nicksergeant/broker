'use strict';

var _ = require('underscore');
var db = require('../db');
var fs = require('fs');
var r = require('rethinkdb');
var resources = JSON.parse(fs.readFileSync(__dirname + '/../../resources.json'));
var uuid = require('node-uuid');

module.exports = function(app, sentry) {
  return function(req, res, next) {

    var locals = {
      env: process.env.NODE_ENV,
      resources: resources
    };

    var sanitizedCustomer = JSON.parse(JSON.stringify(req.customer));

    if (sanitizedCustomer) {
      var twilioEnabled = sanitizedCustomer.twilio ? true : false;

      sanitizedCustomer.feed = sanitizedCustomer.feed ? (typeof(sanitizedCustomer.feed) === 'string' ? 'path' : true) : false;
      delete sanitizedCustomer.domains;
      delete sanitizedCustomer.twilio;
      delete sanitizedCustomer.resetPasswordKey;
      delete sanitizedCustomer.backendSearchURL;

      sanitizedCustomer.twilio = twilioEnabled;
    }

    locals.customerRaw = sanitizedCustomer;
    locals.customer = JSON.stringify(sanitizedCustomer) || null;
    locals.message = req.flash('error');
    locals.user = req.user;

    if (process.env.NODE_ENV === 'production') {
      locals.cssModifiedTime = fs.statSync(__dirname + '/../../client/broker.css').mtime.getTime() / 1000;
      locals.jsModifiedTime = fs.statSync(__dirname + '/../../client/broker.js').mtime.getTime() / 1000;
    }

    if (!req.user && !req.session.anonymousId) {
      req.session.anonymousId = uuid.v4();
    }

    if (!req.customer) {
      locals.items = null;
      return app.render('base', locals, function(err, html) {
        return (err && err.toString() === 'Error: Failed to lookup view "base"') ? process.kill() : res.send(html);
      });
    }

    if (req.customer.templates && req.customer.templates.headHtml) {
      locals.headHtml = fs.readFileSync(__dirname +
          '/../../client/src/app/customers/' + req.customer.name + '/head.html');
    } else {
      locals.headHtml = null;
    }

    if (req.customer.feed || req.customer.backendSearch) {
      locals.items = '[]';
      return app.render('base', locals, function(err, html) {
        return (err && err.toString() === 'Error: Failed to lookup view "base"') ? process.kill() : res.send(html);
      });
    } else {
      var query = r.table('items_' + req.customer.name);
      if (req.customer.fields) {
        query = query.pluck(req.customer.fields);
      }
      query.run(db.conn).then(function(items) {
        items.toArray(function(err, items) {
          if (err) return db.handleError(err, res);
          if (!items.length) {
            items = [];
            if (sentry) {
              sentry.captureMessage('No items for customer.', { level: 'error', extra: {
                'customer': req.customer
              }});
            }
          }
          locals.items = JSON.stringify(items);
          return app.render('base', locals, function(err, html) {
            return (err && err.toString() === 'Error: Failed to lookup view "base"') ? process.kill() : res.send(html);
          });
        });
      }).error(function(err) { db.handleError(err, res); });
    }
  };
};
