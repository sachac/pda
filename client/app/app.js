'use strict';

angular.module('pda2App', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'LocalStorageModule',
  'ui.router',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
  });
