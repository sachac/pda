'use strict';

function pdaCheckToken($scope, $http, $cookies) {
  if (!$scope.token) {
    $http.get('/api/quantified/getToken').success(function(data) {
      $cookies.QUANTIFIED_TOKEN = data.token;
      $scope.token = data.token;
    });
  }
}

function pdaGetActivitySequence() {
  var workSequence = ['Routines', 'Subway', 'E1 Gen', 'Subway', 'Kitchen', 'Cook', 'Dinner', 'Kitchen', 'Drawing', 'Writing', 'Ni No Kuni', 'Routines', 'Sleep'];
  var homeSequence = ['Routines', 'Walk Other', 'Gardening', 'Nonfiction', 'Drawing', 'Personal Lunch', 'Ni No Kuni', 'Coding', 'Learn', 'Writing', 'Kitchen', 'Cook', 'Dinner', 'Kitchen', 'Routines', 'Relax', 'Ni No Kuni', 'Routines', 'Sleep'];
  var weekendSequence = ['Routines', 'Walk Other', 'Gardening', 'Nonfiction', 'Drawing', 'Personal Lunch', 'Family', 'Ni No Kuni', 'Laundry', 'Tidy', 'Kitchen', 'Cook', 'Dinner', 'Kitchen', 'Routines', 'Relax', 'Ni No Kuni', 'Routines', 'Sleep'];
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
  .controller('MainCtrl', function ($scope, $http, $rootScope, $cookies) {
    $scope.awesomeThings = [];
    pdaCheckToken($scope, $http, $cookies);
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
  });
