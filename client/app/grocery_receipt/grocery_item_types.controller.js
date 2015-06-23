angular.module('pda2App').controller('GroceryItemTypesController', function ($scope, $http, $rootScope, localStorageService, $q, Paginator) {
  $http.get('/quantified/receipt_item_types/batch_entry.json').success(function(data) {
    for (var i in data) {
      data[i].candidate_name = data[i].friendly_name;
    }
    $scope.receiptItemTypes = data;
  });
  $scope.itemTypes = [];
  $http.get('/quantified/receipt_item_categories.json').success(function(data) {
    $scope.categories = data;
  });

/*  $scope.mergeWith = function(redundantType, mainType, index) {
    $http.put('/quantified/receipt_item_types/' + redundantType.id + '/move_to/' + mainType.id + '.json').success(function() {
      $rootScope.commandFeedback = 'Merged';
      localStorageService.set('groceryItemTypes', cached);
      $scope.itemTypes.splice(index, 1);
    }).error(function(err) {
      $rootScope.commandFeedback = 'Not merged ' + err;
    });
  };

  $scope.updateFriendlyName = function(itemType, index) {
    var c = cached[index];
    $http.put('/quantified/receipt_item_types/' + itemType.id + '.json', {
      receipt_item_type: {
        id: itemType.id, user_id: itemType.user_id, 'friendly_name': itemType.candidate_name,
        'receipt_item_category_id': itemType.receipt_item_category_id
      }})
      .success(function(data) {
        itemType.friendly_name = itemType.candidate_name;
        cached[index] = itemType;
        localStorageService.set('groceryItemTypes', cached);
      }).error(function(data) {
        itemType.friendly_name = null;
      });
  }; */
}).filter('offset', function() {
  return function(input, start) {
    start = parseInt(start, 10);
    return input.slice(start);
  };
});
