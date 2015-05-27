angular.module('pda2App').controller('GroceryItemTypesController', function ($scope, $http, $rootScope, localStorageService, $q, Paginator) {
  var cached = localStorageService.get('groceryItemTypes');
  var deferred = $q.defer();
  if (!cached) {
    $http.get('/quantified/receipt_item_types.json').success(function(data) {
      cached = {};
      for (var i = 0; i < data.length; i++) {
        cached[data[i].receipt_name.toLowerCase()] = data[i];
      }
      deferred.resolve(cached);
    });
  } else {
    deferred.resolve(cached);
  }
  $scope.lastShown = null;
  $scope.itemTypes = [];
  $scope.displayItems = function(cached) {
    var items = [];
    for (var i in cached) {
      items.push(cached[i]);
    };
    for (i in items) {
      items[i].candidate_name = items[i].friendly_name;
    }
    items = items.sort(function(a, b) {
      if (a.friendly_name < b.friendly_name) return -1;
      if (a.friendly_name > b.friendly_name) return 1;
      if (a.receipt_item_category_id < b.receipt_item_category_id) return -1;
      if (a.receipt_item_category_id > b.receipt_item_category_id) return 1;
      if (a.receipt_name < b.receipt_name) return -1;
      if (a.receipt_name > b.receipt_name) return 1;
      return 0;
    });
    $scope.itemTypes = items;
  };
  deferred.promise.then(function(cached) {
    $scope.displayItems(cached);
  });
  
  var cachedCategories = localStorageService.get('groceryItemCategories');
  $scope.categories = cachedCategories;
  if (!cachedCategories) {
    $http.get('/quantified/receipt_item_categories.json').success(function(data) {
      cachedCategories = data;
      localStorageService.set('groceryItemCategories', data);
      $scope.categories = cachedCategories;
    });
  }

  $scope.updateFriendlyName = function(itemType, index) {
    var c = cached[itemType.receipt_name.toLowerCase()];
    $http.put('/quantified/receipt_item_types/' + itemType.id + '.json', {
      receipt_item_type: {
        id: itemType.id, user_id: itemType.user_id, 'friendly_name': itemType.candidate_name,
        'receipt_item_category_id': itemType.receipt_item_category_id
      }})
      .success(function(data) {
        itemType.friendly_name = itemType.candidate_name;
        cached[itemType.receipt_name.toLowerCase()] = itemType;  
        localStorageService.set('groceryItemTypes', cached);
      }).error(function(data) {
        itemType.friendly_name = null;
      });
  };
}).filter('offset', function() {
  return function(input, start) {
    start = parseInt(start, 10);
    return input.slice(start);
  };
});
