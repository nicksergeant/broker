(function(window, undefined){'use strict';

window.broker = {};

var deps = [
  'epixa-resource',
  'ui.select2',
  'ngRoute',
  'users',
  'admin',
  'events',
  'home',
  'search',
  'utils'
];

if (window.customer.custom) {
  deps.push(window.customer.name);
}

broker = angular.module('broker', deps);
broker.value('$anchorScroll', angular.noop);
broker.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);
broker.run(['resource-api', function(api) {
  api.defaults.transformPath.push(function apiPrefix(path) {
    return '/api' + path;
  });
  api.defaults.pathfinder = function defaultPathfinder(path, resource) {
    if (typeof(window.customer.feed) === 'boolean' && window.customer.feed === true) {
      return path.substring(path.lastIndexOf('/')) + '/' + resource.id;
    } else {
      return path.substring(path.lastIndexOf('/')) + '/' +
        (window.customer.feed || window.customer.backendSearch) ? resource.id : resource.id;
    }
  };
}]);

broker.directive('app', ['$location', '$timeout', '$window', 'events', function($location, $timeout, $window, eventsService) {
  return {
    link: function(scope, element, attrs) {

      var $html = $('html');

      $timeout(function() {
        $('aside.search').css('min-height', $(window).height());
      });
      $timeout(function() {
        if ($window.customer.onload) {
          $window.customer.onload();
        }
      }, 500);

      scope.customer = $window.customer || null;
      scope.env = $window.env || null;
      scope.items = $window.items || null;
      scope.message = $window.message || null;
      scope.user_id = $window.user_id || null;
      scope.$location = $location;

      scope.trackEvent = function() {
        if ($window.customer) {
          var ignoreUrl = false;
          if ($window.customer.tracking && $window.customer.tracking.ignoreUrls) {
            $window.customer.tracking.ignoreUrls.some(function(url) {
              if ($location.path().match(new RegExp(url))) {
                ignoreUrl = true;
                return true;
              }
            });
          }
          if (!ignoreUrl) {
            $timeout(function() {
              eventsService.create({
                label: 'Visited',
                url: $location.path(),
                value: $('title').text()
              });
            });
          }
        }
      };
      scope.toTop = function() {
        $window.scrollTo(0, 0);
      };

      $(window).on('scroll', function() {
        $html.height('auto');
      });

      scope.$on('$routeChangeStart', function() {
        scope.$root.item = null;
        window.NProgress.start();
      });
      scope.$on('$routeChangeSuccess', function() {
        $html.height(($window.customer.templates && $window.customer.templates.minHeight) || 1955);
        window.NProgress.done();
        scope.$root.routeChanged = true;
        scope.message = scope.clearMessage ? null : scope.message;
        scope.clearMessage = scope.message ? true : false;
      });
    }
  };
}]);

Array.max = function(array){
  return Math.max.apply(Math, array);
};

window.addEventListener('load', function() {
  FastClick.attach(document.body);
}, false);

}(window));
