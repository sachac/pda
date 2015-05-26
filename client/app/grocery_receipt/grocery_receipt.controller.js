angular.module('pda2App').controller('GroceryReceiptController', function ($scope, $http, $rootScope, localStorageService, $q) {
  var cached = localStorageService.get('groceryItemTypes');
  var deferred = $q.defer();
  if (!cached) {
    $http.get('/quantified/receipt_item_types.json', {auth_token: $scope.token}).success(function(data) {
      cached = {};
      for (var i = 0; i < data.length; i++) {
        cached[data[i].receipt_name.toLowerCase()] = data[i];
      }
      deferred.resolve(cached);
    });
  } else {
    deferred.resolve(cached);
  }
  deferred.promise.then(function(cached) {
    var incompleteItems = [];
    for (var i in cached) {
      if (cached[i].receipt_name && (!cached[i].friendly_name || !cached[i].receipt_item_category_id)) {
        cached[i].candidate_name = cached[i].friendly_name;
        incompleteItems.push(cached[i]);
        if (incompleteItems.length > 10) break;
      }
    }
    $scope.incompleteItems = incompleteItems;
  });
  

  var cachedCategories = localStorageService.get('groceryItemCategories');
  $scope.categories = cachedCategories;
  if (!cachedCategories) {
    $http.get('/quantified/receipt_item_categories.json', {auth_token: $scope.token}).success(function(data) {
      cachedCategories = data;
      localStorageService.set('groceryItemCategories', data);
      $scope.categories = cachedCategories;
    });
  }

  $scope.updateFriendlyName = function(itemType) {
    if (itemType.candidate_name) {
      $http.put('/quantified/receipt_item_types/' + itemType.id + '.json', {
        receipt_item_type: {id: itemType.id, user_id: itemType.user_id, 'friendly_name': itemType.candidate_name,
                            'receipt_item_category_id': itemType.receipt_item_category_id},
        auth_token: $scope.token}).success(function(data) {
          cached[itemType.receipt_name.toLowerCase()] = data;
          itemType.friendly_name = itemType.candidate_name;
          localStorageService.set('groceryItemTypes', cached);
        }).error(function(data) {
          itemType.friendly_name = null;
        });
    }
  };
});
