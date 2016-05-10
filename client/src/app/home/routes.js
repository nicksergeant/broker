(function(angular){'use strict';

angular.module('home')

.config(['$routeProvider', function($routeProvider) {
  if (!window.items) {
    $routeProvider.when('/:id?', {
      templateUrl: '/client/src/app/home/view.html',
      controller: HomeView
    });
  }
}]);

function HomeView($scope) {
  $scope.$root.bodyClass = 'home';
  $scope.$root.title = 'Home';
}

HomeView.$inject = [
  '$scope'
];

})(angular);
