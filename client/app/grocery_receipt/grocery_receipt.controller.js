angular.module('pda2App').controller('GroceryReceiptController', function ($scope, $http, $rootScope, localStorageService, $q) {
  // Display the receipt being considered
  // 30 days ago
  $scope.startDate = new Date(Date.now() - 86400 * 1000 * 30);
  $scope.endDate = new Date();
  $http.get('/quantified/receipt_item_categories.json').success(function(data) {
    $scope.categories = data;
  });
  $scope.update = function() {
    console.log($scope.startDate);
    console.log($scope.endDate);
    $http.get('/quantified/receipt_items.json?per_page=10000&start=' + (new Date($scope.startDate)).toISOString().substr(0, 10) + '&end=' + (new Date($scope.endDate)).toISOString().substr(0, 10)).success(function(data) {
      $scope.receiptItems = data.entries;
    });
  };
  $scope.update();
  $scope.updateItem = function(item) {
    if (item.receipt_item_category_id) {
      for (var i = 0; i < $scope.categories.length; i++) {
        if ($scope.categories[i].id == item.receipt_item_category_id) {
          item.category_name = $scope.categories[i].name;
        }
      }
    }
    return $http.put('/quantified/receipt_items/' + item.id + '.json',
                     {'receipt_item': item});
  };
});
