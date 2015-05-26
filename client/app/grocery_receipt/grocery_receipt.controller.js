'use strict';

angular.module('pda2App').service('groceryService', function($scope, $http, localStorageService, $state) {
  var getGroceryItemType = function(receiptLine, callback) {
    var cached = localStorageService.get('groceryItemTypes');
    var continueProcessing = function(cached) {
      if (cached[receiptLine]) {
        callback(cached[receiptLine]);
      } else {
        // Create the new receipt item type
        $http.post('/quantified/receipt_item_types.json', {
          'auth_token': $scope.token,
          'receipt_item_type': {
            'receipt_name': receiptLine,
            'friendly_name': ''
          }
        }).success(function(data) {
          cached[data.receipt_name.toLowerCase()] = data;
          localStorageService.set('groceryItemTypes', cached);
          callback(cached[receiptLine]);
        }).error(function(data) { callback(null); });
      }
    };
    
    if (!cached) {
      $http.get('/quantified/receipt_item_types.json', {auth_token: $scope.token}).success(function(data) {
        for (var i = 0; i < data.length; i++) {
          cached[data[i].receipt_name.toLowerCase()] = data[i];
        }
        localStorageService.set('groceryItemTypes', cached);
        continueProcessing(cached);
      });
    } else {
      continueProcessing(cached);
    }
  };
  
  var parseGroceryReceiptLine = function(line) {
    var item = {};
    var matches;
    if ((matches = line.match(/(.*) ([0-9]+\.[0-9]+|[0-9]+) ([0-9]+\.[0-9]+|[0-9]+) *$/))) {
      // Units and unit price
      item.receiptLine = matches[1].toLowerCase();
      item.quantity = matches[2];
      item.unitPrice = matches[3];
    }
    else if ((matches = line.match(/(.*) ([0-9]+\.[0-9]+|[0-9]+) (kg) ([0-9]+\.[0-9]+|[0-9]+) *$/))) {
      // Unit quantity, unit, unit price
      item.receiptLine = matches[1].toLowerCase();
      item.quantity = matches[2];
      item.unitLabel = matches[3];
      item.unitPrice = matches[4];
    }
    else if ((matches = line.match(/(.*) ([0-9]+\.[0-9]+|[0-9]+) *$/))) {
      // total price
      item.receiptLine = matches[1].toLowerCase();
      item.quantity = 1;
      item.unitPrice = matches[2];
      item.totalPrice = matches[3];
    } else {
      item.receiptLine = matches[1];
    }
    return item;
  };
  
  var trackReceiptItem = function(item, successCallback, errorCallback) {
    // Retrieve the name of the receipt type
    getGroceryItemType(item.receiptLine, function(itemType) {
      if (itemType) {
        $http.post('/quantified/receipt_items.json', {
          'auth_token': $scope.token,
          'receipt_item': {
            'receipt_item_type_id': itemType.id,
            'store': $scope.store,
            'date': $scope.date,
            'name': item.receiptLine,
            'quantity': item.quantity,
            'unit': item.unitLabel,
            'unit_price': item.unitPrice,
            'total_price': item.totalPrice || (item.unitQuantity * item.unitPrice)
          }}).success(successCallback).error(errorCallback);
        } else {
          errorCallback('Could not get item type category');
        }
      });
    };
    
    $scope.recognizedGroceryItems = [];
    $scope.processCommand = function(command) {
      var c = command || $scope.command;
      console.log(c);
      var matches;
      if ((matches = c.match(/^store (.*?) *$/))) {
        $scope.store = matches[1];
        $scope.command = '';
      }
      else if ((matches = c.match(/^date(.*?) *$/))) {
        $scope.date = matches[1];
        $scope.command = '';
      }
      else {
        $state.go('grocery_receipt');
        var item = parseGroceryReceiptLine(c);
        if (item.receiptLine) {
          trackReceiptItem(item, function(data) {
            // success
            $scope.command = '';
            $scope.recognizedGroceryItems.push(data);
            console.log(data);
          }, function(data) {
            // error
            console.log(data);
          });
        } else {
          console.log("Unrecognized: " + c);
        }
      }
    };

    $scope.provideGroceryFeedback = function() {
      var c = $scope.command;
      var item = parseGroceryReceiptLine(c);
    };
});
