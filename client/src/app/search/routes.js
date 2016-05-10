(function(angular){'use strict';

angular.module('search')

.config(['$routeProvider', 'usersProvider', function($routeProvider, usersProvider) {
  if (window.items) {
    $routeProvider.when('/', {
      templateUrl: '/client/src/app/search/view.html',
      controller: SearchView,
      reloadOnSearch: false,
      resolve: {
        user: window.customer.users.loginRequired ? usersProvider.resolveLoggedIn() : usersProvider.resolveCurrentUser()
      }
    });
  }
}]);

function SearchView(user, $filter, $http, $scope, $routeParams, $timeout, $window, capitalize, eventsService, usersService) {
  $scope.$root.bodyClass = 'category page';
  $scope.$root.title = capitalize($scope.customer.items && $scope.customer.items.label ? $scope.customer.items.label[1] : null);
  $scope.$root.user = user;
  $scope.$routeParams = $routeParams;
  $scope.customer = customer;
  $scope.exportFields = {};
  $scope.filteredItems = [];
  $scope.filteredItemsViews = [];
  $scope.pageSize = $window.customer.items.pageSize || 15;
  $scope.searching = false;
  $scope.selectedItems = [];
  $scope.userSearched = false;

  for (var i = 0; i < $scope.pageSize; i++) {
    $scope.filteredItemsViews[i] = {};
  }

  $scope.buildFilters = function() {

    var filters = [];

    if ($scope.orderBy.field === 'random') {

      var existingOrders = $window.sessionStorage.getItem('itemOrders');

      if (existingOrders) {
        var orders = {};
        existingOrders = existingOrders.split(',');
        existingOrders.forEach(function(order) {
          order = order.split(':');
          orders[order[0]] = order[1];
        });
        $scope.rawItems.forEach(function(item) {
          item.random = orders[item.id];
        });
      } else {
        var itemOrders = [];
        $scope.rawItems.forEach(function(item) {
          item.random = Math.random();
          itemOrders.push(item.id + ':' + item.random);
        });
        $window.sessionStorage.setItem('itemOrders', itemOrders.join(','));
      }
    }
    $scope.items = $window.crossfilter($scope.rawItems);

    $scope.dimensions = {};

    $scope.customer.filters.forEach(function(filter) {

      if (filter.options && filter.options.length) {
        filter.value = '';
      }

      if (filter.name.indexOf(':fromValues') !== -1) {

        var field = filter.name.split(':fromValues')[0];
        var options = [];

        $scope.rawItems.forEach(function(item) {
          var option = $scope.getNested(item, field);
          if (option) {
            option = typeof(option) === 'string' ? option.trim() : option;
            if (options.indexOf(option) === -1) {
              options.push(option);
            }
          }
        });
        filter.options = options.sort();
        filter.value = '';
      }
      
      $scope.dimensions[filter.field] = $scope.items.dimension(function(item) {
        return $scope.getNested(item, filter.field);
      });

    });

    if ($scope.customer.items.exportable) {
      $scope.exportableFields = Object.keys($scope.rawItems[0]);
    }

    if ($scope.customer.searchFields.length) {
      $scope.dimensions.query = $scope.items.dimension(function(item) {
        var values = [];
        $scope.customer.searchFields.forEach(function(searchField) {
          values.push($scope.getNested(item, searchField));
        });
        return values.join(' ').toLowerCase();
      });
    }

  };
  $scope.exportItems = function() {
    var exportFields = [];
    Object.keys($scope.exportFields).forEach(function(key) {
      if ($scope.exportFields[key] === true) {
        exportFields.push(key);
      }
    });
  };
  $scope.filterItems = function(newValue, oldValue) {
    if ($scope.dimensions) {

      $scope.customer.filters.forEach(function(filter) {
        switch (filter.type) {
          case 'singleSelect':
            $scope.dimensions[filter.field].filterExact(filter.value || undefined);
          break;
          case 'range':
            var toValue = parseInt(filter.to);
            toValue = (toValue === filter.max ? Infinity : toValue);
            $scope.dimensions[filter.field].filterRange([parseInt(filter.from), toValue]);
          break;
        }
      });

      if ($scope.customer.searchFields.length) {
        if ($scope.$root.query) {
          $scope.dimensions.query.filterFunction(function(index) {
            return index.indexOf($scope.$root.query.toLowerCase()) !== -1;
          });
        } else {
          $scope.dimensions.query.filter(null);
        }
      }

      var items;
      if ($scope.customer.filters.length) {
        items = $scope.dimensions[$scope.customer.filters[0].field].top(Infinity);
      } else {
        items = $scope.dimensions.query.top(Infinity);
      }

      items = $filter('orderBy')(items, $scope.orderBy.field);
      $scope.rawFilteredItems = $filter('orderBy')(items, $scope.orderBy.field);
      $scope.filteredItemsCount = items.length;
      items = $filter('startFrom')(items, $scope.$root.currentPage * $scope.pageSize);
      $scope.filteredItems = $filter('limitTo')(items, $scope.pageSize);
      $scope.filteredItemsViews.forEach(function(view) {
        view.item = null;
      });
      $scope.filteredItems.forEach(function(item, key) {
        $scope.filteredItemsViews[key].item = item;
      });
    }
  };
  $scope.getNested = function(obj, path) {
    if (path.indexOf('.') === -1) {
      return obj[path];
    }
    var fields = path.split('.');
    var result = obj;
    for (var i = 0, n = fields.length; i < n; i++) {
      if (result) {
        if (typeof(result) === 'object' && result.length && path.indexOf('$') !== -1) {
          var pathParts = path.split('$.');
          var fieldName = pathParts[pathParts.length - 1];
          result = result[0][fieldName];
          if (result) {
            break;
          }
        } else {
          result = result[fields[i]];
        }
      }
    }
    return result;
  };
  $scope.loadPreBakedSearch = function(preBakedSearch) {
    preBakedSearch.filters.forEach(function(preBakedFilter) {
      if (preBakedFilter.name === 'query') {
        $scope.$root.query = preBakedFilter.value;
      } else {
        $scope.customer.filters.some(function(filter) {
          if (filter.name === preBakedFilter.name) {
            if (filter.type === 'range') {
              filter.from = preBakedFilter.from;
              filter.to = preBakedFilter.to;
            }
            return true;
          }
        });
      }
    });
  };
  $scope.numberOfPages = function() {
    return Math.ceil($scope.filteredItemsCount / $scope.pageSize); 
  };
  $scope.saveUser = function() {
    usersService.update($scope.user);
  };
  $scope.selectItemToggle = function(item) {
    var index = $scope.selectedItems.indexOf(item.id);
    if (index === -1) {
      $scope.selectedItems.push(item.id);
    } else {
      $scope.selectedItems.splice(index, 1);
    }
  };
  $scope.selectAllItems = function() {
    $scope.rawFilteredItems.forEach(function(i) {
      if ($scope.selectedItems.indexOf(i.id) === -1) {
        $scope.selectedItems.push(i.id);
      }
    });
  };
  $scope.selectAllExportableFields = function() {
    $scope.exportableFields.forEach(function(f) {
      $scope.exportFields[f] = true;
    });
  };
  $scope.selectNoExportableFields = function() {
    $scope.exportableFields.forEach(function(f) {
      $scope.exportFields[f] = false;
    });
  };
  $scope.stopPropagation = function(e) {
    e.stopPropagation();
  };

  var orderOptions = [];
  $window.customer.items.orderBy.forEach(function(orderOption) {
    if (orderOption.field === 'random') {
      orderOptions.push({
        id: orderOption.id,
        name: orderOption.name,
        field: orderOption.field,
        reversed: false
      });
    } else {
      orderOptions.push({
        id: orderOption.id,
        name: orderOption.name + ' asc',
        field: orderOption.field,
        reversed: false
      }, {
        id: orderOption.id,
        name: orderOption.name + ' desc',
        field: '-' + orderOption.field,
        reversed: true
      });
    }
  });
  $scope.orderOptions = orderOptions;
  if ($window.customer.items.orderBy[0].default === 'desc') {
    $scope.orderBy = $scope.defaultOrderBy = orderOptions[1];
  } else {
    $scope.orderBy = $scope.defaultOrderBy = orderOptions[0];
  }

  if (items.length) {
    $scope.$root.rawItems = items;
    $scope.buildFilters();
    $scope.filterItems('', '');
    $scope.$root.$broadcast('items-ready');
  } else if (($scope.customer.feed && items.length === 0)) {
    $http({ method: 'GET', url: '/api/items' }).success(function(data) {
      $scope.$root.rawItems = data;
      $scope.buildFilters();
      $scope.filterItems('', '');
      $scope.$root.$broadcast('items-ready');
    });
  }

  var filterChangeTimeout;
  $scope.$watch('customer.filters', function(newValue, oldValue) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      if (($scope.$root.filtersLoaded && !$scope.$root.$location.search().page)) {
        $scope.$root.currentPage = 0;
      } else {
        $scope.$root.filtersLoaded = true;
      }
    }
    $scope.filterItems(newValue, oldValue);
    window.clearTimeout(filterChangeTimeout);
    filterChangeTimeout = window.setTimeout(function() {
      $scope.$root.$broadcast('register-search');
    }, 500);
  }, true);
  $scope.$watch('orderBy', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      $scope.filterItems(newValue, oldValue);
      if ($scope.orderBy !== $scope.defaultOrderBy) {
        $scope.$root.$location.search('sort-by', (newValue.field[0] === '-' ? '-' : '') + newValue.id);
      } else {
        $scope.$root.$location.search('sort-by', null);
      }
    }
  });
  $scope.$watch('$root.currentPage', function(newValue, oldValue) {
    if (newValue || newValue !== oldValue) {
      $scope.filterItems(newValue, oldValue);
      $scope.$root.$location.search('page', newValue ? newValue + 1 : null);
    }
  });
  if (!$window.customer.backendSearch) {
    $scope.$watch('$root.query', function(newValue, oldValue) {
      if (newValue !== oldValue) {
        $scope.$root.currentPage = 0;
      }
      $scope.filterItems(newValue, oldValue);
    });
  } else {
    $scope.$watch('$root.query', function(newValue, oldValue) {
      if (newValue !== oldValue) {
        $scope.$root.currentPage = 0;
      }
      $scope.searching = true;
      if ($scope.$root.query && $scope.$root.query.length > 1) {
        $http({ method: 'GET', url: '/api/search?q=' + $scope.$root.query }).success(function(data) {
          $scope.$root.rawItems = data;
          $scope.buildFilters();
          $scope.filterItems('', '', true);
          $scope.searching = false;
          $scope.$root.$broadcast('items-ready');
        });
      } else {
        $scope.items = [];
        $scope.$root.rawItems = [];
        $scope.filterItems('', '', true);
        $scope.searching = false;
      }
    });
  }

}

SearchView.$inject = [
  'user',
  '$filter',
  '$http',
  '$scope',
  '$routeParams',
  '$timeout',
  '$window',
  'capitalizeFilter',
  'events',
  'users'
];

})(angular);
