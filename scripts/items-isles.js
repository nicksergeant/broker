'use strict';

var db = require('../server/db');
var futures = require('futures');
var request = require('request');
var r = require('rethinkdb');

process.on('uncaughtException', function (error) {
   console.log(error.stack);
   process.exit();
});

db.then(function() {
  request({
    url: 'http://www.privateislandsonline.com/islands/',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
    }
  } , function (err, response, body) {

    var items = JSON.parse(body.match(/var mkrs.\=.(.*);/)[1]);

    console.log('Got ' + items.length + ' items.');

    r.table('items_isles')
      .delete()
      .run(db.conn).then(function(result) {

        console.log('Emptied items database.');

        items.forEach(function(item, k) {
          delete item.id;
          item.image = item.image.replace('thumbl.jpg', 'thumbb.jpg');
          var locationParts = item.top.split(', ');
          item.state = locationParts[0];
          item.country = locationParts[1];
          item.price = parseInt(item.em.replace(/[a-zA-Z]+|\W/g, ''));
          item.hosts = {
            nope: 'zaa',
            whatever: 'hafy',
            thing: {
              yeaaaaap: 'gdsa'
            }
          };
        });

        var sequence = futures.sequence();

        items.forEach(function(item) {
          sequence.then(function(next) {
            r.table('items_isles')
              .insert(item)
              .run(db.conn).then(function(result) {
                if (result.inserted === 1) {
                  console.log('Inserted item: ' + item.strong);
                  next();
                }
              }).error(function(err) { db.handleError(err); });
          });
        });

        sequence.then(function(next) {
          process.exit();
        });

      }).error(function(err) { db.handleError(err); });

  });
});
