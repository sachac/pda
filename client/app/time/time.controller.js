var BAR_HEIGHT = 10;
var NUM_DAYS = 30;
angular.module('pda2App').controller('TimeController', function ($scope, $http, $rootScope, localStorageService) {
  $scope.startDate = new Date(Date.now() - 86400 * 1000 * NUM_DAYS);
  $scope.endDate = new Date();
  $scope.update = function() {
    $http.get('/quantified/records.json?split=split&per_page=10000&category_type=activity&start=' + $scope.startDate.toISOString() + '&end=' + $scope.endDate.toISOString()).success(function(data) {
      $scope.records = data.entries;
    });
  };
  $scope.update();
});

angular.module('pda2App').directive('timeGraph', function() {
  return {
    restrict: 'AE',
    replace: false,
    scope: {data: '=chartData'},
    link: function(scope, element, attrs) {
      scope.$watch('data', function(value) {
        if (!scope.data) return;
        var secondsScale = d3.scale.linear().domain([0,86400]).range([0,63]);
        var chart = d3.select(element[0]);
        var startingDate = new Date(scope.data[0].timestamp).setHours(0,0,0,0) / 1000;
        var endingDate = new Date(scope.data[scope.data.length - 1].timestamp).setHours(0,0,0,0) / 1000;
        var tooltip = d3.select('body').append('div')
              .attr('class', 'tooltip')
              .style('opacity', 0);
        var numDays = (startingDate - (new Date(scope.data[scope.data.length - 1].timestamp).setHours(0,0,0,0)/1000))/86400;
        var dayScale = d3.scale.linear().domain([startingDate, endingDate]).range([0, numDays]);
        // Display main timeline
        var svg = chart.append('svg').attr('class', 'chart').style('width', '100%').style('height', (numDays + 1) * BAR_HEIGHT + 'px');

        var displayCategory = function(d) {
          svg.selectAll('rect.day').filter(function(d2) { return d2.record_category_id == d.record_category_id; }).attr('fill', '#000');
          // Display daily totals
          var totalScale = d3.scale.linear().domain([0, 86400]).range([0,33]);
          var categoryData = d3.nest()
                .key(function(d) { return (new Date(d.timestamp)).setHours(0,0,0,0) / 1000; })
                .key(function(d) { return d.timestamp; })
                .rollup(function(d) {
                  return d3.sum(d, function(g) { return g.duration; });
                }).entries(scope.data.filter(function(d2) { return d2.record_category_id == d.record_category_id; }));
          categoryData.forEach(function(o) {
            // key, values
            var durationSoFar = 0;
            o.values.forEach(function(entry) {
              entry.durationSoFar = durationSoFar;
              entry.dayStart = o.key;
              durationSoFar += entry.values;
            });
            o.total = durationSoFar;
          });
          svg.selectAll('g.total').remove();
          var base = svg.selectAll('g.total').data(categoryData, function(d) { return d.key; });
          var row = base.enter().append('g').attr('class', 'total');
          var rects = row.selectAll('rect').data(function(d2) { return d2.values; }, function(x) { return x.key; });
          rects.enter().append('rect')
            .attr('stroke', '#fff')
            .attr('width', function(d) { return secondsScale(d.values) + '%'; })
            .attr('height', BAR_HEIGHT)
            .attr('x', function(d) { return (66 + secondsScale(d.durationSoFar)) + '%'; })
            .attr('y', function(d) { return dayScale(d.dayStart) * BAR_HEIGHT; })
            .attr('fill', function(d) { return d.color || '#ccc'; });
          row.append('text')
            .attr('x', '66%')
            .attr('y', function(d, i) { return dayScale(d.key) * BAR_HEIGHT + 10; })
            .style('font-size', 'x-small').text(function(d) {
              var minutes = Math.round(d.total / 60);
              var hours = Math.round(minutes / 60);
              minutes = minutes % 60;
              return hours + ':' + d3.format('02d')(minutes);
            });
        };

        svg.selectAll('rect').data(scope.data).enter().append('rect')
          .attr('width', function(d) { return secondsScale(d.duration) + '%'; })
          .attr('height', BAR_HEIGHT)
          .attr('x', function(d) {
            var date = (new Date(d.timestamp)).getTime();
            var midnight = (new Date(d.timestamp)).setHours(0,0,0,0);
            var secondsSinceMidnight = (date - midnight) / 1000;
            return secondsScale(secondsSinceMidnight) + '%';
          })
          .attr('y', function(d) {
            var midnight = (new Date(d.timestamp)).setHours(0,0,0,0) / 1000;
            return dayScale(midnight) * BAR_HEIGHT;
          })
          .attr('class', 'day')
          .attr('title', function(d) { return d.timestamp; })
          .attr('fill', function(d) { return d.color || '#ccc'; })
          .attr('stroke', '#fff')
          .attr('data-record-category-id', function(d) { return d.record_category_id; })
          .on('mouseover', function(d) {
            tooltip.transition()
              .duration(200)
              .style('opacity', 0.9);

            tooltip.html(d.full_name)
              .style('left', d3.event.pageX + 'px')
              .style('top', (d3.event.pageY - 28) + 'px');
            displayCategory(d);
          })
          .on('click', function(d) {
            displayCategory(d);
          })
          .on('mouseout', function(d) {
            tooltip.transition().duration(500).style('opacity', 0);
            chart.selectAll('rect.day').filter(function(d2) {
              return d2.record_category_id == d.record_category_id;
            }).attr('fill', d.color || '#ccc');

          });

      });

    }
  };
});

