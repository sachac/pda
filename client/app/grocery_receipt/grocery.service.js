'use strict';

angular.module('pda2App').factory('GroceryService', function($http, localStorageService, $state, $rootScope) {
  var service = {};
  service.recognizedGroceryItems = [];
  service.processCommand = function(command, callback) {
    var c = command;
    var matches;
    if ((matches = c.match(/^store (.*?) *$/))) {
      service.store = matches[1];
      callback('success', 'Store set.');
    }
    else if ((matches = c.match(/^date (.*?) *$/))) {
      service.date = matches[1];
      callback('success', 'Date set.');
    }
    else if ((matches = c.match(/^today$/))) {
      var today = new Date();
      service.date = today.toISOString();
      callback('success', 'Date set.');
    }
    else if (c.match(/grocery mode/) || $state.current.name == 'grocery_receipt') {
      if (!service.date) {
        callback('error', 'Please specify date.');
        return;
      }
      if (!service.store) {
        callback('error', 'Please specify store.');
        return;
      }
      
      $state.go('grocery_receipt');
      var item = parseGroceryReceiptLine(c);
      trackReceiptItem(item, function(data) {
        // success
        service.recognizedGroceryItems.push(data);
        if (data.friendly_name) {
          callback('success', 'Item tracked: ' + data.name + ' (' + data.friendly_name + ')');
        } else {
          callback('success', 'Item tracked: ' + data.name);
        }
      }, function(data) {
        // error
        callback('error');
      });
    }
  };
  
  service.provideGroceryFeedback = function(c) {
    var item = parseGroceryReceiptLine(c);
  };

  
  var getGroceryItemType = function(receiptLine, callback) {
    var cached = localStorageService.get('groceryItemTypes');
    var continueProcessing = function(cached) {
      if (cached[receiptLine]) {
        callback(cached[receiptLine]);
      } else {
        // Create the new receipt item type
        $http.post('/quantified/receipt_item_types.json', {
          'auth_token': $rootScope.token,
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
      $http.get('/quantified/receipt_item_types.json', {auth_token: $rootScope.token}).success(function(data) {
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
          'auth_token': $rootScope.token,
          'receipt_item': {
            'receipt_item_type_id': itemType.id,
            'store': service.store,
            'date': service.date,
            'name': item.receiptLine,
            'quantity': item.quantity,
            'unit': item.unitLabel,
            'unit_price': item.unitPrice,
            'total_price': item.totalPrice || (parseFloat(item.unitQuantity) * parseFloat(item.unitPrice))
          }}).success(successCallback).error(errorCallback);
      } else {
        errorCallback('Could not get item type category');
      }
    });
  };
  

  return service;
});
