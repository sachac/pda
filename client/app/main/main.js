'use strict';

angular.module('pda2App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('track', {
        url: '/track',
        templateUrl: 'app/main/main.html', // TODO Rename
        controller: 'MainController'
      })
      .state('grocery_receipt', {
        url: '/receipt',
        templateUrl: 'app/grocery_receipt/grocery_receipt.html',
        controller: 'GroceryReceiptController'
      })
      .state('login', {
        url: '/',
        templateUrl: 'app/login/login.html',
        controller: 'LoginController'
      });
  });
