angular.module('pda2App').controller('GroceryReceiptController', function ($scope, $http, $rootScope, localStorageService, $q) {
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
  $scope.updateIncompleteItems = function(cached, numItems) {
    var incompleteItems = $scope.incompleteItems || [];
    var startShowing = !$scope.lastShown;
    for (var i in cached) {
      if (i == $scope.lastShown) {
        startShowing = true;
        continue;
      }
      if (numItems == 0) break;
      if (!startShowing) { continue; }
      if (cached[i].receipt_name && (!cached[i].friendly_name || !cached[i].receipt_item_category_id)) {
        cached[i].candidate_name = cached[i].friendly_name;
        incompleteItems.push(cached[i]);
        numItems--;
        $scope.lastShown = i;
      }
    }
    $scope.incompleteItems = incompleteItems;
  };
  
  deferred.promise.then(function(cached) {
    $scope.updateIncompleteItems(cached, 3);
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
        if (!itemType.added) {
          $scope.updateIncompleteItems(cached, 1);
        }
        itemType.added = true;
        cached[itemType.receipt_name.toLowerCase()] = itemType;  
        localStorageService.set('groceryItemTypes', cached);
      }).error(function(data) {
        itemType.friendly_name = null;
      });
  };
});
