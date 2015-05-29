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
    else if ((matches = c.match(/^([0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) *$/))) {
      service.date = matches[1];
      callback('success', 'Date set.');
    }
    else if ((matches = c.match(/^date (.*?) *$/))) {
      service.date = matches[1];
      callback('success', 'Date set.');
    }
    else if ((matches = c.match(/^today *$/))) {
      var today = new Date();
      service.date = today.toISOString();
      callback('success', 'Date set.');
    }
    else if (c.match(/^grocery mode *$/)) {
      $state.go('grocery_receipt');
      callback('success', 'Now in grocery receipt mode');
    }
    else if (c.match(/^oops *$/)) {
      // Delete the last record
      if (service.lastRecord) {
        $http.delete('/quantified/receipt_items/' + service.lastRecord.id).success(function() {
          callback('success', 'Deleted ' + service.lastRecord.name);
          service.lastRecord = null;
        }).error(function() {
          callback('error', 'Could not delete');
        });
      }
    }
    else if ($state.current.name == 'grocery_receipt') {
      if (!service.date) {
        callback('error', 'Please specify date.');
        return;
      }
      if (!service.store) {
        callback('error', 'Please specify store.');
        return;
      }
      var item = parseGroceryReceiptLine(c);
      trackReceiptItem(item, function(data) {
        // success
        service.recognizedGroceryItems.push(data);
        var output = 'Item tracked: ' + data.name + ' (' + (data.receipt_item_type.friendly_name || 'UNKNOWN') + ')';
        output += ' -> ' + data.quantity + ' * ' + data.unit_price + ' = ' + data.total;
        callback('success', output);
      }, function(data) {
        // error
        callback('error');
      });
    }
  };
  
  service.provideGroceryFeedback = function(c) {
    var item = parseGroceryReceiptLine(c);
  };

  var findGroceryItemInCache = function(search, cache) {
    if (!search) return null;
    search = search.toLowerCase();
    var key;
    for (key in cache) {
      if (cache[key].receipt_name.toLowerCase() == search) {
        return cache[key];
      }
    }
    for (key in cache) {
      if (cache[key].receipt_name.startsWith(search)) {
        return cache[key];
      }
    }
    for (key in cache) {
      if (cache[key].friendly_name.toLowerCase().match(search)) {
        return cache[key];
      }
    }
    return null;
  };
  
  var getGroceryItemType = function(item, doCreate, callback) {
    var cached = localStorageService.get('groceryItemTypes');
    var continueProcessing = function(cached) {
      var type = findGroceryItemInCache(item.receiptLine, cached);
      if (type) {
        callback(type);
      } else if (doCreate) {
        // Create the new receipt item type
        $http.post('/quantified/receipt_item_types.json', {
          'receipt_item_type': {
            'receipt_name': item.receiptLine,
            'friendly_name': item.friendlyName
          }
        }).success(function(data) {
          cached.push(data);
          localStorageService.set('groceryItemTypes', cached);
          callback(data);
        }).error(function(data) { callback(null); });
      }
    };
    
    if (!cached) {
      $http.get('/quantified/receipt_item_types.json').success(function(data) {
        cached = data;
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
    if ((matches = line.match(/(.*) ([0-9]+\.[0-9]+|[0-9]+) ([0-9]+\.[0-9]+) *$/))) {
      // Units and unit price
      item.receiptLine = matches[1].toLowerCase();
      item.quantity = matches[2];
      item.unitPrice = matches[3];
    }
    else if ((matches = line.match(/(.*) ([0-9]+\.[0-9]+|[0-9]+) (kg) ([0-9]+\.[0-9]+) *$/))) {
      // Unit quantity, unit, unit price
      item.receiptLine = matches[1].toLowerCase();
      item.quantity = matches[2];
      item.unitLabel = matches[3];
      item.unitPrice = matches[4];
    }
    else if ((matches = line.match(/(.*) ([0-9]+\.[0-9]+) *$/))) {
      // total price
      item.receiptLine = matches[1].toLowerCase();
      item.quantity = 1;
      item.unitPrice = matches[2];
      item.totalPrice = matches[3];
    }
    else if ((matches = line.match(/(.*) ([0-9]+) *$/))) {
      // total price
      item.receiptLine = matches[1].toLowerCase();
      item.quantity = matches[2];
    }
    else {
      item.receiptLine = line;
      item.quantity = 1;
    }
    // Parse out the friendly name and category if specified
    if ((matches = item.receiptLine.match(/^(.*) \((.*?)\)? *$/))) {
      item.receiptLine = matches[1];
      item.friendlyName = matches[2];
    }
    return item;
  };
  
  var trackReceiptItem = function(item, successCallback, errorCallback) {
    getGroceryItemType(item, true, function(itemType) {
      if (!item.totalPrice && !item.unitPrice && item.quantity) {
        var cache = localStorageService.get('recentReceiptItemsByCategory') || [];
        var recent = cache[itemType.id];
        if (recent) {
          if (recent[0].unit_price) {
            item.unitPrice = recent[0].unit_price;
          } else {
            item.totalPrice = recent[0].total;
          }
        }
      }
      if (!item.totalPrice) {
        item.totalPrice = parseFloat(item.quantity) * parseFloat(item.unitPrice);
      }
      if (itemType) {
        $http.post('/quantified/receipt_items.json', {
          'receipt_item': {
            'receipt_item_type_id': itemType.id,
            'store': service.store,
            'source': 'PDA',
            'date': service.date,
            'name': itemType.receipt_name,
            'quantity': item.quantity,
            'unit': item.unitLabel,
            'unit_price': item.unitPrice,
            'total_price': item.totalPrice
          }}).success(function(data) {
            service.lastRecord = data;
            successCallback(data);
          }).error(errorCallback);
      }
      else {
        errorCallback('Could not get item type category');
      }
    });
  };
  
  service.giveCommandFeedback = function(command, $scope) {
    // Take the latest command
    if ($state.current.name != 'grocery_receipt') return;

    var commands = command.split(/; */);
    var lastCommand = commands[commands.length - 1];
    if (!lastCommand || lastCommand.match(/^(store|date|today)/)) return;
    if (($scope.commandFeedback || '').startsWith(lastCommand)) return;

    var item = parseGroceryReceiptLine(lastCommand);
    var type = getGroceryItemType(item, false, function(itemType) {
      if (!itemType) return;

      var output = itemType.receipt_name;
      if (itemType.friendly_name) {
        output += ' (' + itemType.friendly_name + ')';
      }
      $scope.commandFeedback = output;

      var recentItems = localStorageService.get('recentReceiptItemsByCategory') || [];
      var addPrice = function(data) {
        if (!data) return;
        output += '<table class="table">' + data.map(function(item) { return '<tr><td class="align-left">' + (item.unit_price || item.total_price) + '</td><td>' + item.date + '</td></tr>'; }).join('') + '</table>';
        $scope.commandFeedback = output;
      };
      if (!recentItems[itemType.id]) {
        $http.get('/quantified/receipt_item_types/' + itemType.id + '/latest_receipt_items.json').success(function(data) {
          recentItems[itemType.id] = data;
          localStorageService.set('recentReceiptItemsByCategory', recentItems);
          addPrice(recentItems[itemType.id]);
        });
      }
      else {
        addPrice(recentItems[itemType.id]);
      }
    });
  };
  
  return service;
});
