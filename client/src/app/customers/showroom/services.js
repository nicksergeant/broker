(function(angular){'use strict';

angular.module('showroom')

.factory('items', ['$injector', 'resource-api', function($injector, api) {

  function configureItem(item) {
    item.fuelPhotos = 'pending';
    item.styles = 'pending';
    item.$proxy('fuelPhotos', $injector.get('itemFuelPhotos').collection.bind(null, item.id));
    item.$proxy('styles', $injector.get('styles').collection.bind(null, item.id));
  }

  return {
    get: function(itemID) {
      return api.get('/items/' + itemID, angular.extend({
        initializer: configureItem
      }));
    }
  };

}])
.factory('styles', ['$injector', 'resource-api', function($injector, api) {

  function configureStyle(style) {
    style.colors = 'pending';
    style.options = 'pending';
    style.photos = 'pending';
    style.tmv = 'pending';
    style.$proxy('colors', $injector.get('styleColors').get.bind(null, style.id));
    style.$proxy('options', $injector.get('styleOptions').get.bind(null, style.id));
    style.$proxy('photos', $injector.get('stylePhotos').get.bind(null, style.id));
    style.$proxy('tmv', $injector.get('styleTmv').get.bind(null, style.id));
  }

  return {
    collection: function(itemID) {
      return api.query('/items/' + itemID + '/styles', angular.extend({
        initializer: configureStyle,
        pathfinder: function(path, resource) {
          return '/styles/' + resource.id;
        }
      }));
    }
  };

}])
.factory('styleColors', ['resource-api', function(api) {
  return {
    get: function(styleID) {
      return api.get('/styles/' + styleID + '/colors');
    }
  };
}])
.factory('itemFuelPhotos', ['resource-api', function(api) {
  return {
    collection: function(itemID) {
      return api.get('/items/' + itemID + '/fuelphotos');
    }
  };
}])
.factory('styleOptions', ['resource-api', function(api) {
  return {
    get: function(styleID) {
      return api.get('/styles/' + styleID + '/options');
    }
  };
}])
.factory('stylePhotos', ['resource-api', function(api) {
  return {
    get: function(styleID) {
      return api.get('/styles/' + styleID + '/photos');
    }
  };
}])
.factory('styleTmv', ['resource-api', function(api) {
  return {
    get: function(styleID) {
      return api.get('/styles/' + styleID + '/tmv');
    }
  };
}]);

})(angular);
