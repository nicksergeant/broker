(function(angular){'use strict';

angular.module('utils')

.directive('tooltip', ['$timeout', function($timeout) {
  return function(scope, element, attrs) {
    $timeout(function() {
      $(element).tooltip();
    });
  };
}]);

}(angular));
