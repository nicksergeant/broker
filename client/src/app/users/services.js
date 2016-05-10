(function(angular){'use strict';

angular.module('users')

.provider('users', function UsersProvider() {

  this.$get = ['$injector', '$window', 'resource-api', function($injector, $window, api) {

    function configureUser(user) {
      user.$delete = service.delete.bind(null, user.$path);
    }

    var service = {
      collection: function() {
        return api.query('/users', angular.extend({
          initializer: configureUser,
          pathfinder: function(path, resource) {
            return '/users/' + resource.id;
          }
        }));
      },
      create: function(user) {
        return api.post('/users', user);
      },
      get: function(userId) {
        return api.get('/users/' + userId, angular.extend({
          initializer: configureUser
        }));
      },
      delete: api.delete,
      update: function(user) {
        return api.put(user.$path, user, angular.extend({
          initializer: configureUser
        }));
      },
      resetPassword: function(data) {
        return api.post('/users/reset-password', data);
      },
      resetPasswordConfirm: function(data) {
        return api.post('/users/reset-password/confirm', data);
      }
    };

    return service;
  }];

  this.resolve = function() {
    return ['$route', 'users', function($route, usersService) {
      return usersService.get($route.current.params.id).$reload();
    }];
  };
  this.resolveAdmin = function() {
    return ['$location', '$q', '$window', 'users', function($location, $q, $window, usersService) {
      if (!$window.user_id) {
        $location.path('/login');
        return $q.defer();
      } else {
        return usersService.get($window.user_id).$promise.then(function(user) {
          if (!user.isAdmin) {
            $location.path('/login');
            return $q.defer();
          } else {
            return user;
          }
        });
      }
    }];
  };
  this.resolveAll = function() {
    return ['users', function(usersService) {
      return usersService.collection().$reload();
    }];
  };
  this.resolveCurrentUser = function() {
    return ['$window', 'users', function($window, usersService) {
      if ($window.user_id) {
        return usersService.get($window.user_id).$promise;
      }
    }];
  };
  this.resolveLoggedIn = function() {
    return ['$location', '$q', '$window', 'users', function($location, $q, $window, usersService) {
      if (!$window.user_id) {
        $location.path('/login');
        return $q.defer();
      } else {
        return usersService.get($window.user_id).$promise;
      }
    }];
  };
  
});

})(angular);
