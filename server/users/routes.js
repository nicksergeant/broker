'use strict';

var bcrypt = require('bcrypt-nodejs');
var db = require('../db');
var ejs = require('ejs');
var fs = require('fs');
var gravatar = require('gravatar');
var postmark = require('postmark')('CHANGEME');
var r = require('rethinkdb');
var uuid = require('node-uuid');

var configureUser = function(user) {
  delete user.password;
  user.gravatarUrl = gravatar.url(user.email, { s: 97 }, true);
  return user;
};
var configureUsers = function(users) {
  users.forEach(configureUser);
  return users;
};

exports.create = function() {
  return function(req, res, next) {
    if (!req.user || !req.user.isAdmin) return res.send(403);
    req.body.created = new Date().toISOString();
    bcrypt.hash(req.body.password, null, null, function(err, hash) {
      req.body.password = hash;
      r.table('users_' + req.customer.name)
        .insert(req.body, { returnChanges: true })
        .run(db.conn).then(function(result) {
          if (result.inserted === 1) {
            delete result.changes[0].new_val.password;
            res.send(result.changes[0].new_val);
          } else {
            res.send(500);
          }
        }).error(function(err) { db.handleError(err, res); });
    });
  };
};
exports.get = function() {
  return function(req, res, next) {
    if (!req.user) return res.send(403);
    if (!req.user.isAdmin && req.params.id !== req.user.id) return res.send(500);
    r.table('users_' + req.customer.name)
      .get(req.params.id)
      .run(db.conn).then(function(user) {
        user ? res.json(configureUser(user)) : res.send(404);
      }).error(function(err) { db.handleError(err, res); });
  };
};
exports.delete = function() {
  return function(req, res, next) {
    if (!req.user || !req.user.isAdmin) return res.send(403);
    r.table('users_' + req.customer.name)
      .get(req.params.id).delete()
      .run(db.conn).then(function(result) {
        result.deleted === 1 ? res.send(204) : res.send(404);
      }).error(function(err) { db.handleError(err, res); });
  };
};
exports.list = function() {
  return function(req, res, next) {
    if (!req.user || !req.user.isAdmin) return res.send(403);
    r.table('users_' + req.customer.name)
      .run(db.conn).then(function(users) {
        users.toArray(function(err, users) {
          if (err) return db.handleError(err, res);
          res.send(configureUsers(users));
        });
      }).error(function(err) { db.handleError(err, res); });
  };
};
exports.loginLocal = function(passport) {
  return function(req, res, next) {
    passport.authenticate('local', { failureFlash: true }, function(err, user, info) {
      if (err) { return db.handleError(err, res); }
      if (!user) {
        req.flash('error', 'Incorrect email or password.');
        return res.redirect('/login');
      }
      req.session.message = null;
      req.logIn(user, function(err) {
        if (err) return next(err);
        res.redirect('/');
      });
    })(req, res, next);
  };
};
exports.logoutLocal = function(req, res) {
  req.logout();
  res.redirect('/');
};
exports.signupLocal = function(passport) {
  return function(req, res, next) {
    if (req.customer.users && req.customer.users.signupDisabled) {
      return res.send(404);
    }
    if (!req.body.email || !req.body.password1 || !req.body.password2) {
      return res.send(400);
    }
    if (req.body.password1 !== req.body.password2) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/signup');
    }
    r.table('users_' + req.customer.name)
      .filter({ email: req.body.email })
      .count()
      .run(db.conn).then(function(existingUsers) {
        if (existingUsers > 0) {
          req.flash('error', 'User with that email already exists.');
          return res.redirect('/signup');
        }
        bcrypt.hash(req.body.password1, null, null, function(err, hash) {
          if (err) { throw err; }
          req.body.password = hash;
          delete req.body.password1;
          delete req.body.password2;
          req.body.created = new Date().toISOString();
          req.body.lastLogin = new Date().toISOString();
          r.table('users_' + req.customer.name)
            .insert(req.body, { returnChanges: true })
            .run(db.conn).then(function(result) {
              if (result.inserted === 1) {
                delete result.changes[0].new_val.password;
                result.changes[0].new_val.customer = req.customer.name;
                req.logIn(result.changes[0].new_val, function(err) {
                  if (err) { throw err; }
                  return res.redirect('/');
                });
              } else {
                res.send(500);
              }
            }).error(function(err) { db.handleError(err, res); });
        });
      }).error(function(err) { db.handleError(err, res); });
  };
};
exports.update = function() {
  return function(req, res, next) {
    if (!req.user || !req.user.isAdmin) return res.send(403);
    bcrypt.hash(req.body.password, null, null, function(err, hash) {
      if (!req.body.password) {
        delete req.body.password;
      } else {
        req.body.password = hash;
      }
      r.table('users_' + req.customer.name).get(req.params.id).update(req.body, { returnChanges: true })
        .run(db.conn).then(function(user) {
          delete user.changes[0].new_val.password;
          res.json(user.changes[0].new_val);
        }).error(function(err) { db.handleError(err, res); });
    });
  };
};

exports.resetPassword = function() {
  return function(req, res, next) {
    if (req.body.email) {
      var resetPasswordKey = uuid.v4();
      r.table('users_' + req.customer.name)
        .filter({ email: req.body.email })
        .run(db.conn).then(function(users) {
          users.toArray(function(err, users) {
            if (err) return db.handleError(err, res);
            if (!users.length) return res.send(200);
            r.table('users_' + req.customer.name)
              .get(users[0].id)
              .update({ resetPasswordKey: resetPasswordKey }, { returnChanges: true })
              .run(db.conn).then(function(user) {
                res.send(200);
                if (user.replaced) {
                  req.user = user.changes[0].new_val;
                  var template = __dirname + '/reset-password.txt';
                  var message = ejs.render(fs.readFileSync(template, 'utf-8'), {
                    req: req,
                    resetPasswordKey: resetPasswordKey
                  });
                  postmark.send({
                    From: 'site@broker.is',
                    To: req.body.email,
                    Subject: 'Your password reset request.',
                    TextBody: message
                  });
                }
              }).error(function(err) { db.handleError(err, res); });
          });
        }).error(function(err) { db.handleError(err, res); });
    } else {
      res.send(404);
    }
  };
};
exports.resetPasswordConfirm = function() {
  return function(req, res, next) {
    if (!req.body.user || !req.body.key || !req.body.password) { return res.send(404); }
    r.table('users_' + req.customer.name)
      .filter({ id: req.body.user, resetPasswordKey: req.body.key })
      .run(db.conn).then(function(users) {
        users.toArray(function(err, users) {
          if (err) return db.handleError(err, res);
          if (!users.length) return res.send(500);
          bcrypt.hash(req.body.password, null, null, function(err, hash) {
            r.table('users_' + req.customer.name)
              .get(users[0].id)
              .update({ password: hash }, { returnChanges: true })
              .run(db.conn).then(function(user) {
                res.send(200);
                r.table('users_' + req.customer.name)
                  .get(users[0].id)
                  .replace(r.row.without('resetPasswordKey'))
                  .run(db.conn).error(function(err) { db.handleError(err, res); });
              }).error(function(err) { db.handleError(err, res); });
          });
        });
      }).error(function(err) { db.handleError(err, res); });
  };
};
