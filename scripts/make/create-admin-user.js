'use strict';

var db = require('../../server/db');
var bcrypt = require('bcrypt-nodejs');
var Q = require('q');
var uuid = require('node-uuid');
var r = require('rethinkdb');

var getInput = function(label) {
  var deferred = Q.defer();
  var stdin = process.stdin;
  stdin.resume();
  stdin.setEncoding('utf8');
  process.stdout.write(label + ': ');
  stdin.on('data', function( key ){
    if (key === '\u0003') {
      process.exit();
    }
    deferred.resolve(key);
  });
  return deferred.promise;
};

var customer, email, password;
console.log('\n# Create admin user:\n');
getInput('Customer')
  .then(function(customerInput) {
    customer = customerInput.replace(/![@\w]/g, '').trim();
  })
  .then(function() {
    return getInput('Email').then(function(emailInput) {
      email = emailInput.replace(/![@\w]/g, '').trim();
    })
  .then(function() {
    return getInput('Password').then(function(passwordInput) {
      password = passwordInput.replace(/![@\w]/g, '').trim();
    });
  })
  .then(function() {
    db.then(function() {
      bcrypt.hash(password, null, null, function(err, hash) {
        var admin = {
          isAdmin: true,
          email: email,
          password: hash,
          created: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          id: uuid.v4()
        };
        r.table('users_' + customer)
          .insert(admin)
          .run(db.conn).then(function(result) {
            if (result.inserted === 1) {
              process.exit();
            }
          }).error(function(err) { db.handleError(err); });
      });
    });
  });
});
