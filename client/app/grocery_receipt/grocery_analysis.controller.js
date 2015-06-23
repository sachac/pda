angular.module('pda2App').controller('GroceryAnalysisController', function ($scope, $http, $rootScope, localStorageService, $q) {
  // Display the receipt being considered
  // 30 days ago
  $scope.startDate = new Date(Date.now() - 86400 * 1000 * 90);
  $scope.endDate = new Date();
  $http.get('/quantified/receipt_item_categories.json', {cache: true}).success(function(data) {
    $scope.categories = data;
  });
  $scope.update = function() {
    console.log($scope.startDate);
    console.log($scope.endDate);
    $http.get('/quantified/receipt_items.json?per_page=10000&start=' + (new Date($scope.startDate)).toISOString().substr(0, 10) + '&end=' + (new Date($scope.endDate)).toISOString().substr(0, 10), {cache: true}).success(function(data) {
      $scope.receiptItems = data.entries;
    });
  };
  $scope.update();
  $scope.updateItem = function(item) {
    if (item.receipt_item_category_id) {
      for (var i = 0; i < $scope.categories.length; i++) {
        if ($scope.categories[i].id == item.receipt_item_category_id) {
          item.category_name = $scope.categories[i].name;
        }
      }
    }
    return $http.put('/quantified/receipt_items/' + item.id + '.json',
                     {'receipt_item': item});
  };
});
angular.module('pda2App').directive('receiptAnalysis', function($rootScope) {
  var formatLabel = function(d) {
    return d.key + ': ' + d.value.toFixed(2);
  };
  var drawChart = function(scope, element, attrs) {
    if (!scope.data) return;
    // Draw the chart
    var catData = d3.nest()
          .key(function(d) { return d.category_name || 'Uncategorized'; })
          .key(function(d) { return d.friendly_name || d.receipt_name || d.name || 'Unknown'; })
          .rollup(function(leaves) {
            return d3.sum(leaves, function(d) { return parseFloat(d.total); });
          })
          .entries(scope.data);
    var tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0);
    var chart = d3.select(element[0]).append('svg')
          .attr('width', '100%');
    var x = d3.scale.linear().range([0, chart.style('width')]);
    var ROW_HEIGHT = 20;
    var partition = d3.layout.partition()
          .value(function(d) { return d.values; })
          .children(function(d) { if ($.isArray(d.values)) { return d.values; } else { return null; } });
    var root = {'key': 'Total', 'values': catData};
    // So that it calculates sums at every level
    var partitionedData = partition(root);
    var current = null;
    var updateTable = function(scope, element, attrs, filter) {
      console.log("Updating table", filter);
      var tableRows = d3.select('#receipt-items tbody').selectAll('tr');
      tableRows.transition().duration(100).style('display', function(d) {
        if (filter && filter.key == 'Total') { return 'table-row'; }
        if (filter) {
          // Display only the rows that match this category or any of the categories underneath it
          if (d.category_name == filter.key
              || d.friendly_name == filter.key
              || d.name == filter.key
              || (filter.key == 'Uncategoried' && !d.category_name)) { return 'table-row'; }
        }
        return 'none';
      });
    };
    var setupGraph = function(root) {
      current = root;
      var data = root.children.sort(function(a, b) { return b.value - a.value; });
      var info = chart.selectAll('g').data(data, function(d) { return d.key; });
      var groups = info.enter().append('g');
      info.exit().remove();
      chart.attr('height', data.length * ROW_HEIGHT);
      x.domain([0, data[0].value]);
      var blocks = groups.append('rect').attr('fill', '#ccc').attr('stroke', '#fff')
            .attr('width', function(d) { return x(d.value); })
            .attr('height', 20)
            .attr('x', 0)
            .attr('y', function(d, i) { return i * ROW_HEIGHT; });
      var text = groups.append('text')
            .text(formatLabel)
            .attr('y', function(d, i) { return i * ROW_HEIGHT + 15; })
            .attr('x', 5)
            .style('font-size', 'x-small');
      blocks.on('click', function(d) {
        if (d.children) {
          setupGraph(d);
        }
        d3.event.stopPropagation();
      });
      chart.on('click', function(d) {
        console.log('Clicked background');
        if (current && current.parent) { setupGraph(current.parent); }
      });
      updateTable(scope, element, attrs, root);
    };
    setupGraph(partitionedData[0]);
  };

  var setupTable = function(scope, element, attrs, filter) {
    if (!scope.data) return;
    var table = d3.select('#receipt-items');
    var rows = table.select('tbody').selectAll('tr').data(scope.data).enter().append('tr');
    rows.append('td').html(function(d) { return d.date; });
    rows.append('td').html(function(d) { return d.name; });
    rows.append('td').html(function(d) { return d.friendly_name; });
    rows.append('td').attr('class', 'text-right').html(function(d) { return d.quantity; });
    rows.append('td').attr('class', 'text-right').html(function(d) { return d.unit_price ? d.unit_price : null; });
    rows.append('td').attr('class', 'text-right').html(function(d) { return d.total; });
  };

  return {
    restrict: 'AE',
    replace: false,
    scope: {data: '=chartData'},
    link: function(scope, element, attrs) {
      scope.$watch('data', function(value) {
        setupTable(scope, element, attrs);
        drawChart(scope, element, attrs);
      });
    }
  };
});
