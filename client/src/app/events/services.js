(function(angular){'use strict';

angular.module('events')

.provider('events', function EventsProvider() {

  this.$get = ['$injector', '$window', 'resource-api', function($injector, $window, api) {

    var service = {
      collection: function() {
        return api.query('/events');
      },
      create: function(e) {
        return api.post('/events', e);
      },
      collectionForUser: function(user) {
        return api.query('/users/' + user.id + '/events');
      }
    };

    return service;
  }];
  
});

})(angular);
