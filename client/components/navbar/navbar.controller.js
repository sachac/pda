'use strict';

angular.module('pda2App')
  .controller('NavbarCtrl', function ($scope, $location, $http, localStorageService, $state, GroceryService, $rootScope, $q) {
    $scope.menu = [{
      'title': 'Track',
      'state': 'track'
    }, {
      'title': 'Time',
      'state': 'time'
    }, {
      'title': 'Receipt',
      'state': 'grocery_receipt'
    }, {
      'title': 'Receipt Types',
      'state': 'grocery_item_types'
    }];
    $rootScope.command = '';
    $scope.isCollapsed = true;

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.logout = function() {
      $rootScope.token = null;
      localStorageService.clearAll();
      $state.go('login');
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
      var c = command || $scope.command || $rootScope.command;
      if (!c) return;
      GroceryService.giveCommandFeedback(command, $scope, $rootScope.token);
    };
    $scope.$watch('command', $scope.giveCommandFeedback);
  });
