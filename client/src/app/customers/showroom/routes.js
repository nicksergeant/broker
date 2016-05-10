(function(angular){'use strict';

angular.module('showroom')

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/:make/:model', {
    templateUrl: '/client/src/app/customers/showroom/item-detail.html',
    controller: ItemView,
    resolve: {
      item: ['$http', '$q', '$route', '$window', 'items', function($http, $q, $route, $window, itemsService) {
        var deferred = $q.defer();
        var item;
        $window.items.some(function(i) {
          if (i.defaultStyle.make.niceName === $route.current.params.make &&
              i.niceName === $route.current.params.model) {
            item = i;
          }
        });
        itemsService.get(item.id).$promise.then(function(item) {
          deferred.resolve(item);
        });
        return deferred.promise;
      }]
    }
  });
}]);

function ItemView(item, $scope) {
  $scope.item = item;
}

ItemView.$inject = [
  'item',
  '$scope'
];

}(angular));
