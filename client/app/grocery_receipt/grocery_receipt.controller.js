angular.module('pda2App').controller('GroceryReceiptController', function ($scope, $http, $rootScope, localStorageService, $q) {
  // Display the receipt being considered
  $http.get('/quantified/receipt_items.json').success(function(data) {
    $scope.receiptItems = data.entries;
    $scope.currentPage = data.current_page;
  });
  $scope.newer = function() {
    if ($scope.currentPage > 1) {
      $http.get('/quantified/receipt_items.json?page=' + ($scope.currentPage - 1)).success(function(data) {
        $scope.receiptItems = data.entries;
        $scope.currentPage = data.current_page;
      });
    }
  };
  $scope.older = function() {
    $http.get('/quantified/receipt_items.json?page=' + ($scope.currentPage + 1)).success(function(data) {
      $scope.receiptItems = data.entries;
      $scope.currentPage = data.current_page;
    });
  };
  

});
