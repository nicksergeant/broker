'use strict';

var bcrypt = require('bcrypt-nodejs');
var db = require('../db');
var gravatar = require('gravatar');
var r = require('rethinkdb');

exports.local = function() {

  var LocalStrategy = require('passport-local').Strategy;

  return {
    deserialize: function(user, done) {
      r.table('users_' + user.customer)
        .get(user.id)
        .without('password')
        .run(db.conn).then(function(user) {
          if (user) {
            user.gravatarUrl = gravatar.url(user.email, { s: 37 }, true);
            done(null, user);
          } else {
            done(null, false);
          }
        }).error(function(err) { db.handleError(err); });
    },
    serialize: function(user, done) {
      done(null, { id: user.id, customer: user.customer });
    },
    strategy: new LocalStrategy({
      usernameField: 'email',
      passReqToCallback: true
    }, function(req, email, password, done) {
      r.table('users_' + req.customer.name)
        .filter({ email: req.body.email })
        .run(db.conn).then(function(users) {
          users.toArray(function(err, users) {
            if (err) { throw err; }
            if (!users.length) {
              return done(null, false, { message: 'Incorrect email.' });
            }
            var user = users[0];
            bcrypt.compare(password, user.password, function(err, correct) {
              if (!correct) {
                return done(null, false, { message: 'Incorrect password.' });
              } else {
                user.customer = req.customer.name;
                return done(null, user);
              }
            });
          });
        }).error(function(err) {
          done(err);
          db.handleError(err);
        });
    })
  };
};
