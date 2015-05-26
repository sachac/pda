'use strict';

function loadData($scope, $http, localStorageService) {
  $scope.token = localStorageService.get('QUANTIFIED_TOKEN');
  if (!$scope.token) {
    $http.get('/api/quantified/getToken').success(function(data) {
      localStorageService.set('QUANTIFIED_TOKEN', data.token);
      $scope.token = data.token;
    });
  }
  $scope.categories = localStorageService.get('categories');
  if (!$scope.categories) {
    $http.get('/quantified/record_categories.json?all=1').success(function(data) {
      localStorageService.set('categories', data);
      $scope.categories = data;
    });
  }
}

function pdaGetActivitySequence() {
  var workSequence = ['Routines', 'Subway', 'E1 Gen', 'Subway', 'Kitchen', 'Cook', 'Dinner', 'Kitchen', 'Drawing', 'Writing', 'Ni No Kuni', 'Routines', 'Sleep'];
  var homeSequence = ['Routines', 'Walk Other', 'Gardening', 'Nonfiction', 'Drawing', 'Personal Lunch', 'Ni No Kuni', 'Coding', 'Learn', 'Writing', 'Kitchen', 'Cook', 'Ni No Kuni', 'Routines', 'Sleep'];
  var weekendSequence = ['Routines', 'Walk Other', 'Gardening', 'Nonfiction', 'Drawing', 'Personal Lunch', 'Ni No Kuni', 'Laundry', 'Tidy', 'Kitchen', 'Cook', 'Ni No Kuni', 'Routines', 'Sleep'];
  var day = (new Date()).getDay();
  if (day === 4) {
    return workSequence;
  } else if (day === 0 || day === 6) {
    return weekendSequence;
  } else {
    return homeSequence;
  }                             
}

angular.module('pda2App')
  .controller('MainCtrl', function ($scope, $http, $rootScope, $cookies, localStorageService) {
    loadData($scope, $http, localStorageService);
    $scope.sequenceToday = pdaGetActivitySequence();
    $scope.sequenceStates = [];
    $scope.lastIndex = 0;
    $scope.track = function(activity, $index) {
      $scope.sequenceStates[$index] = 'pending';
      $http.post('/quantified/time/track.json',
                 {'auth_token': $scope.token, category: activity})
        .success(function(err, res) {
          $scope.sequenceStates[$index] = 'success';
          $scope.lastIndex = $index;
        }).error(/*jshint unused: vars */
          function(err, res) {
          $scope.sequenceStates[$index] = 'error';
        });
    };
    $scope.trackById = function(id, $index) {
      $scope.categories[$index].cssClass = 'pending';
      $http.post('/quantified/time/track.json',
                 {'auth_token': $scope.token, category_id: id})
        .success(function(err, res) {
          $scope.categories[$index].cssClass = 'success';
        }).error(/*jshint unused: vars */
          function(err, res) {
            $scope.categories[$index].cssClass = 'error';
        });
    };
    $scope.login = function() {
      localStorageService.clearAll();
      loadData($scope, $http, localStorageService);
    };
  });
