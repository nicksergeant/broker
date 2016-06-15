'use strict';

var fs = require('fs');
var futures = require('futures');
var Q = require('q');
var r = require('rethinkdb');

var db = r.connect({
  host: process.env.RETHINKDB_HOST || 'localhost',
  port: 28015
}).then(function(conn) {

  var sequence = futures.sequence();
  var tables = ['events', 'items', 'users'];

  sequence.then(function(next) {
    r.dbCreate('broker').run(conn).then(function() {
      console.log('- Created database.');
      next();
    }).error(function() {
      console.log('- Database already exists.');
      next();
    });
  });

  var customerRegistry = JSON.parse(fs.readFileSync(__dirname + '/../../server/customers/registry.json'));
  customerRegistry.forEach(function(customer) {
    tables.forEach(function(table) {
      var tableName = table + '_' + customer.name;
      sequence.then(function(next) {
        r.db('broker').tableCreate(tableName).run(conn).then(function() {
          console.log('+ Created table `' + tableName + '`.');
          next();
        }).error(function() {
          console.log('- Table `' + tableName + '` already exists.');
          next();
        });
      });
    });
  });

  sequence.then(function(next) {
    console.log('Done.');
    process.exit();
  });

});
