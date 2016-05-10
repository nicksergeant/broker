'use strict';

var db = require('../server/db');
var fs = require('fs');
var futures = require('futures');
var HTTP = require('q-io/http');
var Q = require('q');
var r = require('rethinkdb');

var get = function(url) {
  var req = HTTP.read(url);
  return req.then(function(res) {
    return JSON.parse(res.toString());
  }).fail(function(err) {
    console.log('[API Error] ' + url);
  });
};

function trim(str) {
  return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

Array.max = function(array){
  return Math.max.apply(Math, array);
};
Array.min = function(array){
  return Math.min.apply(Math, array);
};

process.on('uncaughtException', function (error) {
   console.log(error.stack);
   process.exit();
});

// Get all of the new-year makes and models.
var makes;
var makesReq = get('https://api.edmunds.com/api/vehicle/v2/makes?state=new&fmt=json&api_key=CHANGEME');

db.then(function() {

  makesReq.then(function(req) {

    // Store our makes and models.
    makes = req.makes;

    var sequence = futures.sequence();

    makes.forEach(function(make) {

      // For each model's year, get styles.
      make.models.forEach(function(model) {
        model.years.forEach(function(year) {
          sequence.then(function(next) {
            get('https://api.edmunds.com/api/vehicle/v2/' + make.niceName +'/' + model.niceName + '/' + year.year + '/styles?view=full&fmt=json&api_key=CHANGEME').then(function(res) {
              if (res) {
                year.styles = res.styles;
                console.log('[Styles] ' + year.year + ' ' + make.name + ' ' + model.name +
                  ' (' + res.styles.length + ' styles)');
              } else {
                year.styles = [];
              }
              next();
            });
          });
        });
      });
    });

    return sequence;

  }).then(function(result) {

    // Get photos for each style.
    var sequence = futures.sequence();

    makes.forEach(function(make) {
      make.models.forEach(function(model) {
        model.years.forEach(function(year) {
          if (year.styles) {
            year.styles.forEach(function(style) {
              sequence.then(function(next) {
                get('https://api.edmunds.com/v1/api/vehiclephoto/service/findphotosbystyleid?styleId=' + style.id + '&fmt=json&api_key=CHANGEME').then(function(res) {
                  if (res) {
                    style.photos = res;
                    console.log('[Photos] ' + year.year + ' ' +
                      make.name + ' ' + model.name + ' ' + style.trim + ' (' +
                      res.length + ')');
                  } else {
                    style.photos = [];
                  }
                  next();
                });
              });
            });
          }
        });
      });
    });
    
    return sequence;

  }).then(function(result) {

    // Get MSRP for each style.
    var sequence = futures.sequence();

    makes.forEach(function(make) {
      make.models.forEach(function(model) {
        model.years.forEach(function(year) {
          if (year.styles) {
            year.styles.forEach(function(style) {
              sequence.then(function(next) {
                get('https://api.edmunds.com/v1/api/tmv/tmvservice/calculatenewtmv?styleid=' + style.id + '&zip=14424&fmt=json&api_key=CHANGEME').then(function(res) {
                  if (res) {
                    style.tmv = res.tmv;
                    console.log('[TMV] ' + year.year + ' ' +
                      make.name + ' ' + model.name + ' ' + style.trim + ' ($' +
                      res.tmv.nationalBasePrice.baseMSRP + ')');
                  } else {
                    style.tmv = null;
                  }
                  next();
                });
              });
            });
          }
        });
      });
    });
    
    return sequence;

  }).then(function(result) {

    // Calculate base MPG and MSRP.
    makes.forEach(function(make) {

      make.models.forEach(function(model) {

        model.msrps = [];

        // Get all of the base MSRPs for each year/style.
        model.years.forEach(function(year) {
          if (year.styles) {
            year.styles.forEach(function(style) {
              if (style.tmv) {
                model.msrps.push(style.tmv.nationalBasePrice.baseMSRP);
              }
            });
          }
        });

        if (!model.msrps.length) {
          return;
        }

        // Find the lowest MSRP.
        model.msrp = Array.min(model.msrps);
        model.maxMSRP = Array.max(model.msrps);

        // Get the style with the lowest MSRP and use that for the base MPG
        // and MSRP values.
        model.years.forEach(function(year) {
          if (year.styles) {
            year.styles.forEach(function(style) {

              // Try and find a default photo on the max MSRP style.
              if (style.tmv && style.tmv.nationalBasePrice.baseMSRP === model.maxMSRP) {

                if (style.photos) {
                  style.photos.some(function(photo) {
                    if (photo.shotTypeAbbreviation === 'FQ') {

                      if (photo.photoSrcs.length) {
                        var photoSrc = photo.photoSrcs[0].split('_');
                        photoSrc.pop();
                        photoSrc = photoSrc.join('_');

                        model.defaultPhoto = 'http://media.ed.edmunds-media.com' +
                          photoSrc;

                        return true;
                      }
                    }
                  });
                }
              }

              // Get the default style.
              if (style.tmv && style.tmv.nationalBasePrice.baseMSRP === model.msrp) {
                model.defaultStyle = style;

                if (model.defaultStyle.MPG) {
                  model.cityMPG = model.defaultStyle.MPG.city;
                  model.highwayMPG = model.defaultStyle.MPG.highway;
                } else {
                  model.cityMPG = 'N/A';
                  model.highwayMPG = 'N/A';
                }

                // If we couldn't find a default photo via the max MSRP, use
                // this default style.
                if (!model.defaultPhoto) {
                  if (style.photos) {
                    style.photos.some(function(photo) {
                      if (photo.shotTypeAbbreviation === 'FQ') {

                        if (photo.photoSrcs.length) {

                          var photoSrc = photo.photoSrcs[0].split('_');
                          photoSrc.pop();
                          photoSrc = photoSrc.join('_');

                            model.defaultPhoto = 'http://media.ed.edmunds-media.com' +
                              photoSrc;

                          return true;
                        }
                      }
                    });
                  }
                }
              }
            });
          }
        });

        // Set the default category for this model.
        var body = model.defaultStyle.submodel.body;

        if (body.indexOf('Sedan') !== -1 || body.indexOf('Coupe') !== -1 ||
            body.indexOf('Convertible') !== -1 ||body.indexOf('Wagon') !== -1 ||
            body.indexOf('Hatchback') !== -1) {
          model.category = 'Car';
        } else if (body.indexOf('Minivan') !== -1) {
          model.category = 'Minivan';
        } else if (body.indexOf('Van') !== -1) {
          model.category = 'Van';
        } else if (body.indexOf('SUV') !== -1) {
          model.category = 'SUV';
        } else if (body.indexOf('Cab') !== -1) {
          model.category = 'Truck';
        } else {
          console.log('ERROR: category not found: ' + body);
        }

        // Set the full name and slug.
        model.fullName = model.defaultStyle.make.name + ' ' + model.name;
        model.slug = '/' + model.defaultStyle.make.niceName + '/' +
          model.niceName;

        console.log('[Defaults] ' + '[' + model.category + '] ' +
            make.name + ' ' + model.name + ' ' + trim(model.defaultStyle.trim) +
            ': ' + '$' + model.msrp + ' - ' + model.cityMPG + ' / ' +
            model.highwayMPG);

      });

    });

  }).then(function(result) {

    // Calculate photo group orders.
    makes.forEach(function(make) {
      make.models.forEach(function(model) {
        model.years.forEach(function(year) {
          if (year.styles) {
            year.styles.forEach(function(style) {
              var features = [];
              if (style.photos.length) {
                style.photos.forEach(function(photoGroup) {
                  if (photoGroup.shotTypeAbbreviation === 'FQ') {
                    photoGroup.order = 1;
                  } else if (photoGroup.shotTypeAbbreviation === 'RQ') {
                    photoGroup.order = 2;
                  } else if (photoGroup.shotTypeAbbreviation === 'I') {
                    photoGroup.order = 3;
                  } else if (photoGroup.shotTypeAbbreviation === 'RI') {
                    photoGroup.order = 4;
                  } else if (photoGroup.shotTypeAbbreviation === 'S') {
                    photoGroup.order = 5;
                  } else if (photoGroup.shotTypeAbbreviation === 'CARGO') {
                    photoGroup.order = 6;
                  } else if (photoGroup.shotTypeAbbreviation === 'E') {
                    photoGroup.order = 7;
                  } else if (photoGroup.shotTypeAbbreviation === 'W') {
                    photoGroup.order = 8;
                  } else if (photoGroup.shotTypeAbbreviation === 'D') {
                    photoGroup.order = 9;
                  } else if (photoGroup.shotTypeAbbreviation === 'CC') {
                    photoGroup.order = 10;
                  } else if (photoGroup.shotTypeAbbreviation === 'F') {
                    photoGroup.order = 11;
                  } else if (photoGroup.shotTypeAbbreviation === 'R') {
                    photoGroup.order = 12;
                  } else if (photoGroup.shotTypeAbbreviation === 'DETAIL') {
                    photoGroup.order = 13;
                  } else if (photoGroup.shotTypeAbbreviation === 'B') {
                    photoGroup.order = 14;
                  } else if (photoGroup.shotTypeAbbreviation === 'O') {
                    photoGroup.order = 15;
                  } else if (photoGroup.shotTypeAbbreviation === 'PROFILE') {
                    photoGroup.order = 16;
                  } else {
                    photoGroup.order = 17;
                  }
                });
              }
              if (style.options.length) {
                style.options.forEach(function(option) {
                  if (option.options.length) {
                    option.options.forEach(function(opt) {
                      if (features.indexOf(opt.name.toLowerCase()) === -1) {
                        features.push(opt.name.toLowerCase());
                      }
                    });
                  }
                });
              }
              model.features = features;
            });
          }
        });
      });
    });

  }).then(function(result) {
    console.log('Done with API import.');

  }).then(function(result) {

    var sequence = futures.sequence();

    sequence.then(function(next) {
      r.table('items_showroom_options')
        .delete()
        .run(db.conn).then(function(result) {
          console.log('Emptied options database.');
          next();
        }).error(function(err) { db.handleError(err); });
    });

    makes.forEach(function(make) {
      make.models.forEach(function(model) {
        model.years.forEach(function(year) {
          if (year.styles) {
            year.styles.forEach(function(style) {
              sequence.then(function(next) {
                console.log('Inserting options for style ' + style.id);
                r.table('items_showroom_options')
                  .insert({
                    id: style.id,
                    options: style.options
                  })
                  .run(db.conn).then(function(result) {
                    if (result.inserted === 1) {
                      next();
                    }
                  }).error(function(err) { db.handleError(err); });
              });
            });
          }
        });
      });
    });

    return sequence;

  }).then(function(result) {

    var sequence = futures.sequence();

    sequence.then(function(next) {
      r.table('items_showroom_colors')
        .delete()
        .run(db.conn).then(function(result) {
          console.log('Emptied colors database.');
          next();
        }).error(function(err) { db.handleError(err); });
    });

    makes.forEach(function(make) {
      make.models.forEach(function(model) {
        model.years.forEach(function(year) {
          if (year.styles) {
            year.styles.forEach(function(style) {
              sequence.then(function(next) {
                console.log('Inserting colors for style ' + style.id);
                r.table('items_showroom_colors')
                  .insert({
                    id: style.id,
                    colors: style.colors
                  })
                  .run(db.conn).then(function(result) {
                    if (result.inserted === 1) {
                      next();
                    }
                  }).error(function(err) { db.handleError(err); });
              });
            });
          }
        });
      });
    });

    return sequence;

  }).then(function(result) {

    var sequence = futures.sequence();

    sequence.then(function(next) {
      r.table('items_showroom_tmv')
        .delete()
        .run(db.conn).then(function(result) {
          console.log('Emptied tmv database.');
          next();
        }).error(function(err) { db.handleError(err); });
    });

    makes.forEach(function(make) {
      make.models.forEach(function(model) {
        model.years.forEach(function(year) {
          if (year.styles) {
            year.styles.forEach(function(style) {
              sequence.then(function(next) {
                console.log('Inserting tmv for style ' + style.id);
                r.table('items_showroom_tmv')
                  .insert({
                    id: style.id,
                    tmv: style.tmv
                  })
                  .run(db.conn).then(function(result) {
                    if (result.inserted === 1) {
                      next();
                    }
                  }).error(function(err) { db.handleError(err); });
              });
            });
          }
        });
      });
    });

    return sequence;

  }).then(function(result) {

    var sequence = futures.sequence();

    sequence.then(function(next) {
      r.table('items_showroom_photos')
        .delete()
        .run(db.conn).then(function(result) {
          console.log('Emptied photos database.');
          next();
        }).error(function(err) { db.handleError(err); });
    });

    makes.forEach(function(make) {
      make.models.forEach(function(model) {
        model.years.forEach(function(year) {
          if (year.styles) {
            year.styles.forEach(function(style) {
              sequence.then(function(next) {
                console.log('Inserting photos for style ' + style.id);
                r.table('items_showroom_photos')
                  .insert({
                    id: style.id,
                    photos: style.photos
                  })
                  .run(db.conn).then(function(result) {
                    if (result.inserted === 1) {
                      next();
                    }
                  }).error(function(err) { db.handleError(err); });
              });
            });
          }
        });
      });
    });

    return sequence;

  }).then(function(result) {

    var sequence = futures.sequence();

    sequence.then(function(next) {
      r.table('items_showroom_styles')
        .delete()
        .run(db.conn).then(function(result) {
          console.log('Emptied styles database.');
          next();
        }).error(function(err) { db.handleError(err); });
    });

    makes.forEach(function(make) {
      make.models.forEach(function(model) {
        model.years.forEach(function(year) {
          if (year.styles) {
            year.styles.forEach(function(style) {
              delete style.colors;
              delete style.options;
              delete style.photos;
              delete style.tmv;
              sequence.then(function(next) {
                console.log('Inserting style for ' + model.defaultStyle.make.name + ' ' + model.name);
                r.table('items_showroom_styles')
                  .insert(style)
                  .run(db.conn).then(function(result) {
                    if (result.inserted === 1) {
                      next();
                    }
                  }).error(function(err) { db.handleError(err); });
              });
            });
          }
        });
      });
    });

    return sequence;

  }).then(function(result) {

    var sequence = futures.sequence();

    sequence.then(function(next) {
      r.table('items_showroom')
        .delete()
        .run(db.conn).then(function(result) {
          console.log('Emptied items database.');
          next();
        }).error(function(err) { db.handleError(err); });
    });

    makes.forEach(function(make) {

      make.models.forEach(function(model) {

        delete model.years;

        sequence.then(function(next) {

          if (!model.defaultStyle) {
            console.log('Skipping because no defaultStyle ' + model.name);
            next();
          } else {
            console.log('Inserting ' + model.defaultStyle.make.name + ' ' + model.name);
            r.table('items_showroom')
              .insert(model)
              .run(db.conn).then(function(result) {
                if (result.inserted === 1) {
                  next();
                }
              }).error(function(err) { db.handleError(err); });
          }
        });
      });

    });

    return sequence;

  }).then(function(result) {
    console.log('Done with database import.');
    process.kill();
  });
});

return makesReq;
