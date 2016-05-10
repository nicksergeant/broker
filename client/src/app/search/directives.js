(function(angular){'use strict';

angular.module('search')

.directive('imageOnLoad', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var loaded = [];
      var $image = $(element);
      scope.$watch(function() {
        return $image.attr('src');
      }, function() {
        $image.parent().removeClass('error');
        if (!scope.loaded()) {
          $image.hide();
        }
      });
      $image.load(function() {
        $image.prev().css('background-image', 'url(' + $image.attr('src') + ')');
        loaded.push($image.attr('src'));
        scope.$apply();
      });
      $image.error(function() {
        $image.parent().addClass('error');
        $image.hide();
      });
      scope.loaded = function() {
        return loaded.indexOf($image.attr('src')) !== -1;
      };
    }
  };
})
.directive('itemsSearch', ['$http', '$location', '$timeout', 'events', function($http, $location, $timeout, eventsService) {
  return function(scope, element, attrs) {
    var typingTimeout;
    var $element = $(element);

    var extractQueryParamsToFilters = function() {
      window.customer.filters.forEach(function(filter) {
        var value;
        switch (filter.type) {
          case 'range':
            value = {
              'from': $location.search()[filter.id + '-from'],
              'to': $location.search()[filter.id + '-to']
            };
            filter.from = value.from ? value.from : filter.min;
            filter.to = value.to ? value.to : filter.max;
          break;
          case 'singleSelect':
          case 'boolean':
            value = $location.search()[filter.id];
            if (value) {
              filter.value = $location.search()[filter.id];
            } else {
              filter.value = filter.defaultValue || '';
            }
          break;
        }
      });
    };
    var registerSearch = function(inScope) {
      if (!inScope) {
        scope.$apply(function() {
          $location.search('q', scope.$root.query !== '' ? scope.$root.query : null);
          if (scope.rawItems && scope.rawItems.length) {
            window.customer.filters.forEach(function(filter) {
              switch (filter.type) {
                case 'range':
                  filter.from !== filter.min ?
                    $location.search(filter.id + '-from', parseInt(filter.from)) :
                    $location.search(filter.id + '-from', null);
                  filter.to !== filter.max ?
                    $location.search(filter.id + '-to', parseInt(filter.to)) :
                    $location.search(filter.id + '-to', null);
                break;
                case 'singleSelect':
                case 'boolean':
                  filter.value ?
                    $location.search(filter.id, filter.value) :
                    $location.search(filter.id, null);
                break;
              }
            });
          }
        });
      }
      if (scope.$root.query) {
        eventsService.create({
          label: 'Searched for',
          value: scope.$root.query
        });
      }
    };

    scope.$root.$on('items-ready', function() {
      extractQueryParamsToFilters();
    });
    scope.$root.$on('register-search', function() {
      registerSearch();
    });

    $element.keydown(function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        window.clearTimeout(typingTimeout);
        registerSearch();
      } else {
        if (typingTimeout !== undefined) {
          window.clearTimeout(typingTimeout);
        }
        typingTimeout = window.setTimeout(registerSearch, 500);
      }
    });
    $(window).on('keydown', function(e) {
      if (e.keyCode === 191) {
        $('input', $element).focus();
        e.preventDefault();
      }
    });

    scope.$watch(function() {
      return $location.search();
    }, function() {
      if ($location.search().page) {
        scope.$root.currentPage = $location.search().page - 1;
      } else {
        scope.$root.currentPage = 0;
      }
      if ($location.search().q) {
        scope.$root.query = $location.search().q;
      }
      if ($location.search()['sort-by']) {
        var fieldName = $location.search()['sort-by'];
        var isReversed = fieldName[0] === '-';
        if (isReversed) {
          fieldName = fieldName.substring(1);
        }
        scope.orderOptions.some(function(orderOption) {
          if (fieldName === orderOption.id && orderOption.reversed === isReversed) {
            scope.orderBy = orderOption;
            return true;
          }
        });
      } else {
        if (window.customer.items.orderBy[0].default === 'desc') {
          scope.orderBy = scope.orderOptions[1];
        } else {
          scope.orderBy = scope.orderOptions[0];
        }
      }
      extractQueryParamsToFilters();
    });

    $timeout(function() {
      if (scope.rawItems && scope.rawItems.length) {
        extractQueryParamsToFilters();
      }
    });

  };
}])
.directive('slider', ['$timeout', function($timeout) {
  return {
    scope: {
      min: '=',
      max: '=',
      totalmin: '=',
      totalmax: '=',
      step: '='
    },
    compile: function(element, attrs) {
      return {
        post: function(scope, element, attrs) {
          $timeout(function() {
            var $element = $(element);
            $element.noUiSlider({
              start: [scope.min, scope.max],
              step: scope.step,
              range: {
                min: scope.totalmin,
                max: scope.totalmax
              }
            });
            $element.on({
              slide: function(){
                scope.$apply(function() {
                  scope.min = $element.val()[0];
                  scope.max = $element.val()[1];
                });
              }
            });
          });
        }
      };
    }
  };
}])
.directive('trackItemVisit', ['events', '$window', function(eventsService, $window) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      $(element).click(function() {
        eventsService.create({
          label: 'Viewed item',
          url: attrs.href,
          value: attrs.itemName
        });
      });
    }
  };
}]);

}(angular));
