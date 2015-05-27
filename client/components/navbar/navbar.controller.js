'use strict';

angular.module('pda2App')
  .controller('NavbarCtrl', function ($scope, $location, $http, localStorageService, $state, GroceryService, $rootScope, $q) {
    $scope.menu = [{
      'title': 'Track',
      'state': 'track'
    }, {
      'title': 'Receipt',
      'state': 'grocery_receipt'
    }];
    
    $scope.isCollapsed = true;
    // TODO Remove test data
    $scope.store = 'no frills';
    $scope.date = '2015-05-23';
    
    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.logout = function() {
      $rootScope.token = null;
      localStorageService.clearAll();
    };
    $scope.feedback = [];
    $scope.processCommand = function(command) {
      var c = command || $scope.command;
      var commands = (command || $scope.command).split(/; */);
      var failed = false;
      for (var i in commands) {
        var deferred = $q.defer();
        GroceryService.processCommand(
          commands[i],
          $rootScope.token,
          function(status, data) {
            if (status === 'success') {
              deferred.resolve({status: status, data: data});
            } else {
              deferred.reject({status: status, data: data});
            }
          });
        deferred.promise.then(function(info) {
          $scope.feedback.unshift(info);
        }, function(info) {
          $scope.feedback.unshift(info);
          failed = true;
        });
      }
      if (!failed) {
        $scope.command = '';
      }
    };
    $scope.giveCommandFeedback = function(command) {
      var c = command || $scope.command;
      GroceryService.giveCommandFeedback(command, $scope, $rootScope.token);
    };

  });
