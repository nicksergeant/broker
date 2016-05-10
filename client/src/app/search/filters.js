(function(angular){'use strict';

angular.module('search')

.filter('clean', function () {
  return function (item) {
    return $('<div />').html(item).text()
      .replace('&#40;', '(')
      .replace('&amp;', '&')
      .replace('&apos;', '\'');
  };
})
.filter('fuzzyFilter', function () {
  return function (items, searchText) {
    if (!searchText) {
      return items;
    }
    var searchWords = searchText.split(' ');
    return _.filter(items, function(item) {
      return _.every(searchWords, function(searchWord) {
        var lowerCasedSearchWord = searchWord.toLowerCase();
        if (item.index) {
          return item.index.search(lowerCasedSearchWord) !== -1;
        }
      });
    });
  };
})
.filter('startFrom', function() {
  return function(input, start) {
    start = +start;
    return input.slice(start);
  };
});

}(angular));
