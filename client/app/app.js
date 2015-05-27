'use strict';

angular.module('pda2App', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'LocalStorageModule',
  'ui.router',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $httpProvider.interceptors.push(function($q, $rootScope) {
      return {
        request: function(config) {
          if (config.url.startsWith('/quantified/') && $rootScope.token) {
            config.url += ((config.url.indexOf('?') >= 0) ? '&' : '?')
              + 'auth_token=' + $rootScope.token;
            console.log(config);
          }
          return config || $q.when(config);
        }
      };
    });
    // intercept for oauth tokens
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
  });
