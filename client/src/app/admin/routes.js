(function(angular){'use strict';

angular.module('admin')

.config(['$routeProvider', 'usersProvider', function($routeProvider, usersProvider) {
  $routeProvider.when('/admin', {
    templateUrl: '/client/src/app/admin/dashboard.html',
    controller: AdminDashboardView,
    resolve: {
      allUsers: usersProvider.resolveAll(),
      user: usersProvider.resolveAdmin()
    }
  });
}])
.config(['$routeProvider', 'usersProvider', function($routeProvider, usersProvider) {
  $routeProvider.when('/admin/events', {
    templateUrl: '/client/src/app/admin/events-view.html',
    controller: AdminEventsView,
    resolve: {
      allUsers: usersProvider.resolveAll(),
      user: usersProvider.resolveAdmin()
    }
  });
}]);

function AdminDashboardView(user, allUsers, $filter, $scope, usersService) {
  $scope.$root.user = user;
  $scope.$root.title = 'Users - Admin';
  $scope.$root.bodyClass = 'admin page';
  $scope.users = allUsers;

  $scope.create = function(newUser) {
    usersService.create(newUser).then(function(newUser) {
      $scope.users.add(newUser);
      $scope.newUser = {};
    });
  };
  $scope.delete = function(user, e) {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this user?')) {
      user.$delete().then(function() {
        $scope.users.remove(user);
      });
    }
  };
  $scope.save = function(user, e) {
    usersService.update(user);
  };
  $scope.showEvents = function(user) {
    if (!$scope.editing) {
      if ($scope.eventsShown === user) {
        $scope.eventsShown = false;
      } else {
        $scope.eventsShown = user;
      }
    }
  };
  $scope.stopPropagation = function(e) {
    e.stopPropagation();
  };

  $scope.$on('edit-user-modal-hidden', function() {
    $scope.editing = false;
  });

}
function AdminEventsView(user, $scope, $timeout) {
  $scope.$root.user = user;
  $scope.$root.title = 'Events - Admin';
}

AdminDashboardView.$inject = [
  'user',
  'allUsers',
  '$filter',
  '$scope',
  'users'
];
AdminEventsView.$inject = [
  'user',
  '$scope',
  '$timeout'
];

})(angular);
