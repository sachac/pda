angular.module('pda2App').controller('GroceryReceiptController', function ($scope, $http, $rootScope, localStorageService, $q) {
  // Display the receipt being considered
  // 30 days ago
  $scope.startDate = new Date(Date.now() - 86400 * 1000 * 30);
  $scope.endDate = new Date();
  $scope.update = function() {
    $http.get('/quantified/receipt_items.json?per_page=10000&start=' + $scope.startDate.toISOString().substr(0, 10) + '&end=' + $scope.endDate.toISOString().substr(0, 10)).success(function(data) {
      $scope.receiptItems = data.entries;
    });
  };
  $scope.update();

});
angular.module('pda2App').directive('receiptAnalysis', function($rootScope) {
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
    var SIZE = 300;
    var tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0);
    
    var partition = d3.layout.partition()
          .value(function(d) { return d.values; })
          .children(function(d) { if ($.isArray(d.values)) { return d.values; } else { return null; } });
    var chart = d3.select(element[0]).append('svg')
          .attr('viewBox', '0 0 ' + SIZE + ' ' + SIZE)
          .attr('width', SIZE).attr('height', SIZE)
          .append('g')
          .attr('transform', function(d) { return 'translate(' + (SIZE / 2) + ',' + (SIZE / 2) + ')'; });
    var x = d3.scale.linear().range([0, 2 * Math.PI]),
        y = d3.scale.linear().range([0, SIZE / 2]);
    var root = {'key': 'Total', 'values': catData};
    var cell = chart.selectAll('g')
          .data(partition(root))
          .enter()
          .append('g');
    var formatLabel = function(d) {
      return d.key + ': ' + d.value.toFixed(2);
    };
    var arc = d3.svg.arc()
          .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
          .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
          .innerRadius(function(d) { return Math.max(0, y(d.y)); })
          .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

    var arcTween = function(d) {
      var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
      yd = d3.interpolate(y.domain(), [d.y, 1]),
      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, SIZE / 2]);
      return function(d, i) {
        return i
          ? function(t) { return arc(d); }
        : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
      };
    };
    
    var block = cell.append('path')
          .attr('d', arc)
          .attr('fill', '#ccc')
          .attr('stroke', '#fff')
          .on('mouseover', function(d) {
            tooltip.transition().duration(200)
              .style('opacity', 0.9);
            tooltip.html(formatLabel(d))
              .style('left', d3.event.pageX + 'px')
              .style('top', (d3.event.pageY - 28) + 'px');
            $rootScope.commandFeedback = formatLabel(d);
          })
          .on('mouseout', function(d) {
            tooltip.transition().duration(500).style('opacity', 0);
          })
          .on('click', function(d) {
            x.domain([d.x, d.x + d.dx]);
            block.transition().duration(500)
              .attrTween('d', arcTween(d));
            updateTable(scope, element, attrs, d);
          });
/*    cell.append('text')
      .attr('x', 5)
      .attr('y', 20)
      .attr('width', function(d) { return x(d.dx) - 10; })
      .text(formatLabel); */
  };

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
        drawChart(scope, element, attrs);
        setupTable(scope, element, attrs);
      });
    }
  };
});


