'use strict';

var db = require('../server/db');
var r = require('rethinkdb');

process.on('uncaughtException', function (error) {
   console.log(error.stack);
   process.exit();
});

db.then(function() {
  r.dbDrop('broker').run(db.conn).then(function(result) {
    console.log('Done.');
    process.exit();
  }).error(function() {
    console.log('[Note] Database `broker` does not exist.');
    process.exit();
  });
});
