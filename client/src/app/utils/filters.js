(function(angular){'use strict';

angular.module('utils')

.filter('capitalize', function() {
  return function(input) {
    if (input && typeof(input) === 'string') {
      return input.charAt(0).toUpperCase() + input.substring(1);
    } else {
      return input;
    }
  };
})
.filter('moment', function() {
  return function(input, format) {
    if (input) {
      if (format) {
        return window.moment(input).format(format);
      } else {
        return window.moment(input).calendar();
      }
    }
  };
});

})(angular);
