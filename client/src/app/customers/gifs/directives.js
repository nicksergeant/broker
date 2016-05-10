(function(angular){'use strict';

angular.module('gifs')

.directive('item', ['$window', function($window) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var $element = $(element);
      var rootUrl = $window.env === 'production' ? 'i.nicksergeant.com' : 'i.local.broker.is:8080';

      scope.previewUrl = false;

      scope.$watch('view.item.filename', function() {
        if (scope.view.item) {
          scope.view.item.thumbEncoded = encodeURI(scope.view.item.thumb);
          scope.view.item.urlEncoded = encodeURI(scope.view.item.url);
        }
      });
      scope.$watch('showPreview', function(showPreview) {
        if (scope.view.item) {
          if (showPreview) {
            scope.previewUrl = 'http://' + rootUrl + '/' + scope.view.item.source.replace('.', '') + '/' + encodeURI(scope.view.item.filename);
          } else {
            scope.previewUrl = false;
          }
        }
      });
    }
  };
}]);

}(angular));
