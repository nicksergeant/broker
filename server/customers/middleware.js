'use strict';

var fs = require('fs');

exports.getCustomer = function(req, res, next) {
  var customers = JSON.parse(fs.readFileSync(__dirname + '/registry.json'));
  req.customer = false;
  customers.some(function(customer) {
    var host = req.headers.host.split(':')[0];
    if (customer.domains[0].indexOf('*') !== -1) {
      customer.domains.forEach(function(domain) {
        var toCheck = domain.replace('*.', '');
        if (host.indexOf(toCheck) !== -1) {
          customer.wildcardDomains = true;
          req.customer = customer;
          return true;
        }
      });
    } else {
      if (customer.domains.indexOf(host) !== -1) {
        req.customer = customer;
        return true;
      }
    }
  });
  next();
};
