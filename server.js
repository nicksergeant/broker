'use strict';

// Modules.
var auth = require('basic-auth');
var bodyParser = require('body-parser');
var compression = require('compression');
var cookieParser = require('cookie-parser');
var customers = require('./server/customers');
var db = require('./server/db');
var ejs = require('ejs');
var errorhandler = require('errorhandler');
var express = require('express');
var events = require('./server/events');
var flash = require('connect-flash');
var fs = require('fs');
var items = require('./server/items');
var morgan  = require('morgan');
var passport = require('passport');
var protectJSON = require('./server/lib/protectJSON');
var raven = require('raven');
var session = require('express-session');
var users = require('./server/users');

// Express application.
var app = express();

// Application config.
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
app.set('views', 'client/src');
app.use(compression());
app.set('json spaces', 0);
app.use(flash());

// Static
app.use('/client', express.static('./client'));

// Server middleware.
app.use(cookieParser('CHANGEME'));
app.use(morgan(process.env.NODE_ENV === 'production' ? '' : 'dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'CHANGEME'
}));

// Traceback on uncaught exceptions.
process.on('uncaughtException', function (error) {
  console.log(error.stack);
  process.exit();
});

// Production provisions.
if (process.env.NODE_ENV === 'production') {
  app.use(errorhandler({ dumpExceptions: true, showStack: true }));
  app.use(protectJSON);
  var sentry = new raven.Client('https://CHANGEME:CHANGEME@app.getsentry.com/CHANGEME');
  sentry.patchGlobal();
}

// Authentication.
passport.deserializeUser(users.auth.local().deserialize);
passport.serializeUser(users.auth.local().serialize);
passport.use(users.auth.local().strategy);
app.use(passport.initialize());
app.use(passport.session());

// Application middleware.
app.use(customers.middleware.getCustomer);
app.use(users.middleware.lastActive());

// Login and signup.
app.get('/logout', users.routes.logoutLocal);
app.post('/login', users.routes.loginLocal(passport));
app.post('/signup', users.routes.signupLocal(passport));

// Users API.
app.get('/api/users/test', users.routes.signupLocal());
app.get('/api/users', users.routes.list());
app.post('/api/users', users.routes.create());
app.get('/api/users/:id', users.routes.get());
app.put('/api/users/:id', users.routes.update());
app.delete('/api/users/:id', users.routes.delete());
app.post('/api/users/reset-password', users.routes.resetPassword());
app.post('/api/users/reset-password/confirm', users.routes.resetPasswordConfirm());

// Events API.
app.get('/api/events', events.routes.list());
app.post('/api/events', events.routes.create());
app.get('/api/users/:id/events', events.routes.getForUser());

// Items API.
app.get('/api/items', items.routes.list());
app.get('/api/items/:id', items.routes.get());
app.get('/api/search', items.routes.search());
app.post('/api/items/export', items.routes.exportItems());

// Showroom items API.
app.get('/api/styles/:id/colors', items.showroomRoutes.colorsList());
app.get('/api/styles/:id/options', items.showroomRoutes.optionsList());
app.get('/api/styles/:id/photos', items.showroomRoutes.photosList());
app.get('/api/styles/:id/tmv', items.showroomRoutes.tmv());
app.get('/api/items/:id/styles', items.showroomRoutes.stylesList());
app.get('/api/items/:id/fuelPhotos', items.showroomRoutes.fuelPhotosList());

// Assorted routes.
app.get('/demo', function(req, res) {
  res.render('app/customers/' + req.customer.name + '/demo', null);
});
app.get('/embed', function(req, res) {
  res.render('app/customers/' + req.customer.name + '/embed', {
    searchUrl: req.protocol + '://' + req.host + (process.env.NODE_ENV !== 'production' ? ':3000' : '')
  });
});
app.get('/official.gif', compression(), function(req, res, next) {
  res.sendfile('client/src/assets/img/official.gif');
});

app.get('/*', require('./server/app')(app, sentry));

db.then(function() {
  app.listen(process.env.PORT || 3000, '0.0.0.0');
});
