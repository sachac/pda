'use strict';

angular.module('pda2App')
  .controller('LoginController', function ($scope, $http, $rootScope, localStorageService, $state) {
    $rootScope.token = $rootScope.token || localStorageService.get('token');
    if ($rootScope.token) {
      $state.go('track');
    }
    $scope.login = function() {
      $http.post('/quantified/api/v1/tokens.json',
                 {login: $scope.username, password: $scope.password})
        .success(function(data) {
          $rootScope.token = data.token;
          localStorageService.set('token', $rootScope.token);
          $state.go('time');
      });
    };
  });
