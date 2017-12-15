'use strict';

var fs = require('fs');
var gm = require('gm');
var futures = require('futures');
var jsdom = require("jsdom");
var r = require('rethinkdb');
var request = require('request');

process.on('uncaughtException', function(error) {
  console.log(error.stack);
  process.exit();
});

var gifs = [];
var sourcesSequence = futures.sequence();

var getExtension = function(filename) {
  var filenameParts = filename.split('.');
  return filenameParts[filenameParts.length - 1].toLowerCase();
};
var getFilename = function(filename) {
  return decodeURI(filename.replace('?dl=0', ''));
};

// Bukk.it
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting bukk.it GIFs.');
  request('http://bukk.it/', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('tr td a');
      rawGifs.each(function(i) {
        var filename = getFilename(rawGifs.eq(i).attr('href'));
        var extension = getExtension(filename);
        if (filename !== 'olia/' && filename !== 'robots.txt' && extension !== 'ico' && extension !== 'html' && filename !== '¯\\_(ツ)__¯.gif') {
          gifs.push({
            filename: filename,
            url: 'http://bukk.it/' + filename,
            thumb: '/client/src/app/customers/gifs/thumbs/bukkit/' + filename,
            extension: extension,
            source: 'bukk.it'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});

// Nick.sg
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting nick.sg GIFs.');
  request('https://s3.amazonaws.com/nick.sg/', function(err, response, body) {
    var parseString = require('xml2js').parseString;
    parseString(body, function(err, response) {
      var rawGifs = response.ListBucketResult.Contents;
      rawGifs.forEach(function(gif) {
        var filename = getFilename(gif.Key[0]);
        var extension = getExtension(filename);
        if (extension !== 'ico' && extension !== 'html' && filename !== 's/') {
          gifs.push({
            filename: filename,
            url: 'https://nick.sg/' + filename,
            thumb: '/client/src/app/customers/gifs/thumbs/nicksg/' + filename,
            extension: extension,
            source: 'nick.sg'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});

// Dave Stanton
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting Dave Stanton GIFs.');
  request('http://gifs-davestanton.s3.amazonaws.com/', function(err, response, body) {
    var parseString = require('xml2js').parseString;
    parseString(body, function(err, response) {
      var rawGifs = response.ListBucketResult.Contents;
      rawGifs.forEach(function(gif) {
        var filename = getFilename(gif.Key[0]);
        var extension = getExtension(filename);
        if (extension !== 'ico' && extension !== 'html') {
          gifs.push({
            filename: filename,
            url: 'http://gifs-davestanton.s3-website-us-east-1.amazonaws.com/' + filename,
            thumb: '/client/src/app/customers/gifs/thumbs/davestanton/' + filename,
            extension: extension,
            source: 'davestanton'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});

// sjl
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AACh8eusAlfb7PILDoP67W-qa', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Angry) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AACTbuxkzEnrvc5Qzce-RnfJa/Angry', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Fail) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AAAR1TE2DALeHaiI1Cm7FIn9a/Fail', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Happy) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AAA8peC0B6N4IWRwUTXSCwEia/Happy', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Rustlin) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AADEIFGL52eunFjJ8j5AhNxka/Rustlin', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Sigh) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AADVA4C8MHyzDo-l7UtzMcDCa/Sigh', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Wat) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AACWHdBMONWDLJM7HNg6Jf0ga/Wat', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Astonished) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AADaIxyILzTVf4SpIPIOC0_aa/Astonished', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Don\'t Care) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AADtHb4QYtBPYfHkY1SRkfbaa/Dont%20Care', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Fuck This) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AACIS2EcLBQloaEbovxLdGaua/Fuck%20This', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Popcorn) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AACnyvA7A0QCMYEV-KAdBhvSa/popcorn', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Sad) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AABbuYPjz9Rii1bgXO2qXluja/Sad', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Snicker) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AABQtruSX-roQlF0lVGGu4nea/Snicker', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (You cannot be serious) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AACWzaP-YKWw0tjGtLzPNS8na/You%20cannot%20be%20serious', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Border) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AACVGJC7dBsSJaitSk69OttXa/Bored', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Drubk) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AABXQy-2OZo5AEYamhIZX8mYa/Drubk', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Fuck You) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AADA4LPh8XwDsOqaYEVgn4Vma/Fuck%20You', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Right On) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AADJg1QH17ga8Lff5rM-bPoga/Right%20On', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Scared) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AACzSSAcMBHBhAJyjHapSBgka/Scared', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting sjl (Surreal) GIFs.');
  request('https://www.dropbox.com/sh/pplrw47nl9mg35d/AAC4I6KwQxmStU0e5w9kZeyBa/Surreal', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a.thumb-link');
      rawGifs.each(function(i) {
        var url = rawGifs.eq(i).attr('href');
        var urlParts = url.split('/');
        var filename = getFilename(urlParts[urlParts.length - 1]);
        if (filename.indexOf('?lst') === -1) {
          var extension = getExtension(filename);
          gifs.push({
            filename: filename,
            url: 'http://i.nicksergeant.com/sjl/' + filename,
            originalUrl: url.replace('?dl=0', '') + '?dl=1',
            thumb: '/client/src/app/customers/gifs/thumbs/sjl/' + filename,
            extension: extension,
            source: 'sjl'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});

// misatkes.com
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting misatkes GIFs.');
  request('http://misatkes.com/', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.jQuery('a');
      rawGifs.each(function(i) {
        var filename = getFilename(rawGifs.eq(i).attr('href'));
        var extension = getExtension(filename);
        var rawHref = rawGifs.eq(i).attr('href');
        if (rawHref !== '../' && filename !== '?C=N;O=D' && filename !== '?C=M;O=A' && filename !== '?C=S;O=A' && filename !== '?C=D;O=A') {
          gifs.push({
            filename: filename,
            url: 'http://misatkes.com/' + filename,
            thumb: '/client/src/app/customers/gifs/thumbs/misatkes/' + filename,
            extension: extension,
            source: 'misatkes'
          });
        }
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});

// gifs.stwrt.ca
sourcesSequence.then(function(sourcesNext) {
  console.log('Getting stwrt GIFs.');
  request('http://gifs.stwrt.ca/', function(err, response, body) {
    jsdom.env(body, ['http://code.jquery.com/jquery.js'], function(errors, window) {
      var rawGifs = window.document.getElementsByClassName('gif');
      [].forEach.call(rawGifs, function(elem) {
        var filename = elem.innerHTML.trim();
        var extension = getExtension(filename);
        var rawHref = elem.href;
        gifs.push({
          filename: filename,
          url: rawHref,
          thumb: '/client/src/app/customers/gifs/thumbs/stwrt/' + filename,
          extension: extension,
          source: 'stwrt'
        });
      });
      console.log(' - Done.');
      sourcesNext();
    });
  });
});

sourcesSequence.then(function(sourcesNext) {

  // Save sources.
  var sequence = futures.sequence();
  gifs.forEach(function(gif) {
    sequence.then(function(next) {
      if (!fs.existsSync(__dirname + '/../assets/gifs/' + gif.source.replace('.', '') + '/' + gif.filename)) {
        console.log('Saving... ' + gif.filename);
        request(gif.originalUrl || gif.url).pipe(fs.createWriteStream(__dirname + '/../assets/gifs/' + gif.source.replace('.', '') + '/' + gif.filename)).on('close', function() {
          console.log(' - Done.');
          next();
        });
      } else {
        console.log('Already have ' + gif.filename);
        next();
      }
    });
  });

  // Save thumbnails.
  sequence.then(function(next) {
    var thumbsSequence = futures.sequence();
    gifs.forEach(function(gif) {
      thumbsSequence.then(function(thumbsSequenceNext) {
        if (!fs.existsSync(__dirname + '/../client/src/app/customers/gifs/thumbs/' + gif.source.replace('.', '') + '/' + gif.filename)) {
          if (gif.extension === 'gif') {
            console.log('Saving GIF thumbnail... ' + gif.filename);
            gm(__dirname + '/../assets/gifs/' + gif.source.replace('.', '') + '/' + gif.filename + '[0]').write(__dirname + '/../client/src/app/customers/gifs/thumbs/' + gif.source.replace('.', '') + '/' + gif.filename, function(err) {
              if (err) console.log(' !! Could not save ' + gif.filename, err);
              thumbsSequenceNext();
            });
          } else {
            console.log('Saving non-GIF thumbnail... ' + gif.filename);
            fs.createReadStream(__dirname + '/../assets/gifs/' + gif.source.replace('.', '') + '/' + gif.filename).pipe(fs.createWriteStream(__dirname + '/../client/src/app/customers/gifs/thumbs/' + gif.source.replace('.', '') + '/' + gif.filename)).on('close', function() {
              thumbsSequenceNext();
            });
          }
        } else {
          thumbsSequenceNext();
        }
      });
    });
    thumbsSequence.then(function(thumbsSequenceNext) {
      next();
    });
  });

  // Save to database.
  sequence.then(function(next) {
    var db = r.connect({
      host: 'localhost',
      db: 'broker',
      port: 28015
    }).then(function(conn) {
      db.handleError = function(err, res) {
        if (res) res.send(500);
        console.log(err);
        throw err;
      };
      r.table('items_gifs')
        .delete()
        .run(conn).then(function(result) {
          console.log('Emptied items database.');

          var itemsSequence = futures.sequence();
          gifs.forEach(function(item) {
            itemsSequence.then(function(itemsSequenceNext) {

              r.table('items_gifs')
                .insert(item)
                .run(conn).then(function(result) {
                  if (result.inserted === 1) {
                    console.log('Inserted item: [' + item.source + '] ' + item.filename);
                    itemsSequenceNext();
                  }
                }).error(function(err) { db.handleError(err); });

            });
          });

          itemsSequence.then(function(itemsSequenceNext) {
            next();
          });

        }).error(function(err) { db.handleError(err); });
    }).error(function(err) {
      console.log(err);
      throw err;
    });
  });

  sequence.then(function(next) {
    sourcesNext();
  });

});

sourcesSequence.then(function(next) {
  console.log('All done.');
  process.exit();
});

return;
