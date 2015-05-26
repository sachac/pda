'use strict';

angular.module('pda2App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainController'
      })
      .state('grocery_receipt', {
        url: '/receipt',
        templateUrl: 'app/grocery_receipt/grocery_receipt.html',
        controller: 'GroceryReceiptController'
      });
  });
