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

  var addBeers = function(beers) {
    var sequence = futures.sequence();
    beers.forEach(function(beer) {
      sequence.then(function(next) {
        beer.style = beer.style ? beer.style.name : null;
        beer.category = (beer.style && beer.style.category) ? beer.style.category.name : null;
        if (beer.breweries && beer.breweries.length && beer.breweries[0].name) {
          beer.brewery = beer.breweries[0].name;
        }
        console.log(' - Inserting ' + beer.name);
        r.table('items_hops')
          .insert(beer)
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
  var getBeers = function(page, next) {
    page = page || 1;
    var url = 'http://api.brewerydb.com/v2/beers?key=CHANGEME&withBreweries=Y&withSocialAccounts=Y&p=' + page;
    var req = HTTP.read(url);
    return req.then(function(res) {
      var result = JSON.parse(res.toString());
      console.log('Got page ' + page + ' of ' + result.numberOfPages + '.');
      return addBeers(result.data).then(function() {
        if (result.currentPage <= result.numberOfPages) {
          getBeers(result.currentPage + 1, next);
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
    r.table('items_hops')
      .delete()
      .run(db.conn).then(function(result) {
        console.log('Emptied items database.');
        next();
      }).error(function(err) { db.handleError(err); });
  });
  sequence.then(function(next) {
    getBeers(1, next);
  });
  sequence.then(function(next) {
    console.log('Done.');
    process.kill();
  });
});
