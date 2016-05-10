'use strict';

var compression = require('compression');
var express = require('express');
var fs = require('fs');
var Q = require('q');
var walk = require('walk');

module.exports = function(app) {
  var deferred = Q.defer();
  var customerRegistry = JSON.parse(fs.readFileSync(__dirname + '/../customers/registry.json'));
  customerRegistry.forEach(function(customer) {
    var base = __dirname + '/../customers/' + customer.name;
    var extensions = ['html', 'htm'];
    if (fs.existsSync(base)) {
      app.use('/static/' + customer.name, compression());
      app.use('/static/' + customer.name, express.static('/../customers/' + customer.name + '/static'));
      app.use('/static/' + customer.name, function(req, res, next) { res.send(404); });
      var routes = [];
      var walker = walk.walk(base, { followLinks: false });
      walker.on('file', function(root, stat, next) {
        var filenameParts = stat.name.split('.');
        var extension = filenameParts[filenameParts.length - 1];
        if (extensions.indexOf(extension) !== -1) {
          var path = root + '/' + stat.name.replace('.' + extension, '').replace(base, '');
          var route = path.replace(base, '');
          routes.push({ route: route, extension: extension });
        }
        next();
      });
      walker.on('end', function() {
        routes.forEach(function(route) {
          app.get(route.route, function(req, res, next) {
            var path = req.path;
            path = path.substring(0, path.length - 1);
            path = __dirname + '/../customers/' + req.customer.name + path;
            if (fs.existsSync(path + '.' + route.extension)) {
              res.render(path);
            } else {
              next();
            }
          });
        });
        deferred.resolve();
      });
    }
  });
  return deferred.promise;
};
