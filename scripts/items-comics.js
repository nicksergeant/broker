'use strict';

var db = require('../server/db');
var fs = require('fs');
var futures = require('futures');
var HTTP = require('q-io/http');
var Q = require('q');
var r = require('rethinkdb');

process.on('uncaughtException', function (error) {
   console.log(error.stack);
   process.exit();
});

db.then(function() {

  var addItems = function(items) {
    var sequence = futures.sequence();
    items.forEach(function(item) {
      sequence.then(function(next) {
        console.log(' - Inserting ' + item.title);
        if (item.startYear === 0) {
          delete item.startYear;
        }
        r.table('items_comics')
          .insert(item)
          .run(db.conn).then(function(result) {
            if (result.inserted === 1) {
              next();
            }
          }).error(function(err) { db.handleError(err); });
      });
    });
    return sequence;
  };
  var currentPage = 1;
  var getItems = function(page, next) {
    page = page || 1;
    var url = 'http://gateway.marvel.com/v1/public/series?apikey=CHANGEME&hash=CHANGEME&ts=1&limit=100&offset=' + (page === 1 ? 0 : ((page - 1) * 100));
    var req = HTTP.read(url);
    return req.then(function(res) {
      var result = JSON.parse(res.toString());
      var numberOfPages = Math.ceil(result.data.total / 100);
      console.log('Got page ' + page + ' of ' + numberOfPages + '.');
      return addItems(result.data.results).then(function() {
        if (page <= numberOfPages) {
          getItems(page + 1, next);
        } else {
          next();
        }
      });
    }).fail(function(err) {
      console.log('[API Error] ' + url);
    });
  };

  var sequence = futures.sequence();
  sequence.then(function(next) {
    r.table('items_comics')
      .delete()
      .run(db.conn).then(function(result) {
        console.log('Emptied items database.');
        next();
      }).error(function(err) { db.handleError(err); });
  });
  sequence.then(function(next) {
    getItems(1, next);
  });
  sequence.then(function(next) {
    console.log('Done.');
    process.kill();
  });
});
