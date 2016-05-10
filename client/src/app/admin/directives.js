(function(angular){'use strict';

angular.module('admin')

.directive('events', ['$routeParams', '$timeout', 'events', function($routeParams, $timeout, eventsService) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      compact: '=',
      limit: '=',
      eventsUser: '='
    },
    templateUrl: '/client/src/app/admin/events.html',
    link: function($scope, element, attrs) {
      var eventsFn = $scope.eventsUser ? eventsService.collectionForUser : eventsService.collection;
      $scope.events = eventsFn($scope.eventsUser);
    }
  };
}])
.directive('users', [function() {
  return {
    link: function(scope, element, attrs) {
      $('#edit-user').on('hidden.bs.modal', function() {
        scope.$emit('edit-user-modal-hidden');
      });
    }
  };
}]);

})(angular);
