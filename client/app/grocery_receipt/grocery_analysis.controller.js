angular.module('pda2App').controller('GroceryAnalysisController', function ($scope, $http, $rootScope, localStorageService, $q) {
  // Display the receipt being considered
  // 6530 days ago
  $scope.startDate = new Date(Date.now() - 86400 * 1000 * 90);
  $scope.endDate = new Date();
  $http.get('/quantified/receipt_item_categories.json', {cache: true}).success(function(data) {
    $scope.categories = data;
  });
  $scope.update = function() {
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
  var tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
  function drawChart(scope, element, attrs) {
    // Draw the chart
    var catData = d3.nest()
          .key(function(d) { return d.category_name || 'Uncategorized'; })
          .key(function(d) { return d.friendly_name || d.receipt_name || d.name || 'Unknown'; })
          .rollup(function(leaves) {
            return d3.sum(leaves, function(d) { return parseFloat(d.total); });
          })
          .entries(scope.data);
    d3.select(element[0]).select('svg.barchart').remove();
    var chart = d3.select(element[0]).append('svg').attr('class', 'barchart')
          .attr('width', '100%');
    var partition = d3.layout.partition()
          .value(function(d) { return d.values; })
          .children(function(d) { if ($.isArray(d.values)) { return d.values; } else { return null; } });
    var root = {'key': 'Total', 'values': catData};
    // So that it calculates sums at every level
    var partitionedData = partition(root);
    var current = null;
    setupGraph(element, scope.data, partitionedData[0]);
  }
  function updateTable(filter) {
    var average = filter.value * 7 / numDays;
    d3.select('.total').html('Total: ' + filter.value.toFixed(2) + ' Avg per week: ' + average.toFixed(2));

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
  function setupGraph(element, receiptItems, root) {
    var ROW_HEIGHT = 20;
    var current = root;
    if (!root.children) return;
    var data = root.children.sort(function(a, b) { return b.value - a.value; });
    var chart = d3.select(element[0]).select('svg');
    chart.selectAll('*').remove();
    var x = d3.scale.linear().range([0, $(element[0]).find('svg').width() - 50]);
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
        setupGraph(element, receiptItems, d);
      } else {
        showDetailedPlot(element, receiptItems, d);
        updateTable(d);
      }
      d3.event.stopPropagation();
    });
    chart.on('click', function(d) {
      if (current && current.parent) { setupGraph(element, receiptItems, current.parent); }
    });
    updateTable(root);
  }
  

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

  var maxDate, minDate, numDays;
  function showDetailedPlot(element, receiptItems, d) {
    var filteredEntries = receiptItems.filter(function(x) { return x.friendly_name == d.key; });

    var data = d3.nest()
          .key(function(d) { return new Date(d.date); })
          .rollup(function(leaves) {
            var temp = {
              total: d3.sum(leaves, function(d) { return parseFloat(d.total); }),
              quantity: d3.sum(leaves, function(d) { return parseFloat(d.quantity); })
            };
            temp.unitPrice = temp.total / temp.quantity;
            return temp;
          }).entries(filteredEntries);
    var parent = d.parent;
    var svg = d3.select(element[0]).select('svg');
    svg.selectAll('*').remove();

    var margin = {top: 30, right: 20, bottom: 30, left: 40},
        width = 640 - margin.left - margin.right,
        height = 150 - margin.top - margin.bottom;
    svg.attr('height', height + margin.top + margin.bottom);
    svg.attr('width', width + margin.left + margin.right);
    var g = svg.append('g').attr('class', 'scatterplot');
    var dateFormat = d3.time.format('%Y-%m-%d');
    var tickFormat;
    if (numDays > 365) {
      tickFormat = d3.time.format('%b %Y');
    } else {
      tickFormat = d3.time.format('%b %d');
    }
      
    // setup x 
    var xValue = function(d) { return new Date(d.key); }, // data -> value
        xScale = d3.time.scale.utc().range([0, width]), // value -> display
        xMap = function(d) { return xScale(xValue(d));}, // data -> display
        xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(tickFormat);
    // setup y
    var yValue = function(d) { return d.values.total;}, // data -> value
        yScale = d3.scale.linear().range([height, 0]), // value -> display
        yMap = function(d) { return yScale(yValue(d));}, // data -> display
        yAxis = d3.svg.axis().scale(yScale).orient("left");

    var colorScale = d3.scale.linear().range(['blue', 'orange']);
    var cValue = function(d) { return d.values.unitPrice; };
    colorScale.domain([d3.min(data, cValue), d3.max(data, cValue)]);

    var sizeScale = d3.scale.linear().range([2, 2]);
    var sizeValue = function(d) { return d.values.quantity; };
    xScale.domain([new Date(minDate.getTime() - 86400000), maxDate]);
    yScale.domain([0, d3.max(data, yValue) + 5]);
    sizeScale.domain([0, d3.max(data, function(d) { return d.values.quantity; })]);
    // x-axis
    g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("Date");

    // y-axis
    g.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Total price");
    var line = d3.svg.line().x(xMap).y(yMap);
    g.append('path').datum(data).attr('class', 'line').attr('d', line);
    // draw dots
    g.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("r", function(d) { return sizeScale(sizeValue(d)); })
      .attr("cx", xMap)
      .attr("cy", yMap)
      .style("fill", function(d) { return colorScale(cValue(d)); })
      .on("mouseover", function(d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(['Date: ' + dateFormat(new Date(d.key)),
                      'Quantity: ' + d.values.quantity.toFixed(3),
                      'Unit price: ' + d.values.unitPrice.toFixed(2),
                      'Total: ' + d.values.total.toFixed(2)].join('<br />'))
          .style("left", (d3.event.pageX + 5) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
    svg.on('click', function() {
      if (parent) { setupGraph(element, receiptItems, parent); }
    });

    // draw legend
  }
  
  return {
    restrict: 'AE',
    replace: false,
    scope: {data: '=chartData', start: '=start', end: '=end'},
    link: function(scope, element, attrs) {
      scope.$watch('data', function(value) {
        if (!scope.data) return;
        maxDate = new Date(scope.data[0].date);
        minDate = new Date(scope.data[scope.data.length - 1].date);
        numDays = (maxDate.getTime() - minDate.getTime()) / 86400000 + 1;

        setupTable(scope, element, attrs);
        drawChart(scope, element, attrs);
        // scatterPlot(scope, element, attrs);
      });
    }
  };
});
