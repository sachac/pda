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
      .state('grocery_item_types', {
        url: '/grocery_item_types',
        templateUrl: 'app/grocery_receipt/grocery_item_types.html',
        controller: 'GroceryItemTypesController'
      })
      .state('grocery_analysis', {
        url: '/grocery_analysis',
        templateUrl: 'app/grocery_receipt/grocery_analysis.html',
        controller: 'GroceryAnalysisController'
      })
      .state('login', {
        url: '/',
        templateUrl: 'app/login/login.html',
        controller: 'LoginController'
      })
      .state('time', {
        url: '/time',
        templateUrl: 'app/time/time.html',
        controller: 'TimeController'
      });
  })
  .run(['$rootScope', '$state', '$stateParams', 'localStorageService',
        function($rootScope, $state, $stateParams, localStorageService) {
      $rootScope.$on('$stateChangeStart', function(event, toState, toStateParams) {
        // track the state the user wants to go to; authorization service needs this
        $rootScope.token = $rootScope.token || localStorageService.get('token');
        if (!$rootScope.token && toState.name != 'login') {
          event.preventDefault();
          $state.transitionTo('login');
        }
      });
    }
  ]);
