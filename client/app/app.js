'use strict';

angular.module('pda2App', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'LocalStorageModule',
  'xeditable',
  'ui.router',
  'ui.bootstrap'
])
.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
})
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $httpProvider.interceptors.push(function($q, $rootScope) {
      return {
        request: function(config) {
          if (config.url.startsWith('/quantified/') && $rootScope.token) {
            config.url += ((config.url.indexOf('?') >= 0) ? '&' : '?')
              + 'auth_token=' + $rootScope.token;
          }
          return config || $q.when(config);
        }
      };
    });
    // intercept for oauth tokens
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
  })
.directive(
  'dateInput',
  function(dateFilter) {
    return {
      require: 'ngModel',
      template: '<input type="date" class="form-control"></input>',
      replace: true,
      link: function(scope, elm, attrs, ngModelCtrl) {
        ngModelCtrl.$formatters.unshift(function (modelValue) {
          return dateFilter(modelValue, 'yyyy-MM-dd');
        });

        ngModelCtrl.$parsers.push(function(modelValue){
           return angular.toJson(modelValue,true)
          .substring(1,angular.toJson(modelValue).length-1);
        });

      }
    };
  });


