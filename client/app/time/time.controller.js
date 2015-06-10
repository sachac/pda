angular.module('pda2App').controller('TimeController', function ($scope, $http, $rootScope, localStorageService) {
  var start = new Date((new Date()).setHours(0,0,0,0) - 7 * 24 * 60 * 60 * 1000).toISOString();
  $http.get('/quantified/records.json?split=split&per_page=10000&category_type=activity&start=' + start).success(function(data) {
    $scope.records = data.entries;
  });
});

angular.module('pda2App').directive('timeGraph', function() {
  return {
    restrict: 'AE',
    replace: false,
    scope: {data: '=chartData'},
    link: function(scope, element, attrs) {
      scope.$watch('data', function(value) {
        if (!scope.data) return;
        var secondsScale = d3.scale.linear().domain([0,86400]).range([0,100]);
        var BAR_HEIGHT = 20;
        var chart = d3.select(element[0]);
        var startingDate = new Date(scope.data[0].timestamp).setHours(0,0,0,0) / 1000;
        var tooltip = d3.select('body').append('div')
              .attr('class', 'tooltip')
              .style('opacity', 0);
        var numDays = (startingDate - (new Date(scope.data[scope.data.length - 1].timestamp).setHours(0,0,0,0)/1000))/86400;
        chart.append('svg').attr('class', 'chart').style('width', '100%').style('height', (numDays + 1) * BAR_HEIGHT + 'px')
          .selectAll('rect').data(scope.data).enter().append('rect')
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
            return (startingDate - midnight) * BAR_HEIGHT / 86400;
          })
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
            chart.selectAll('rect').filter(function(d2) { return d2.record_category_id == d.record_category_id; }).attr('fill', '#000');
          })
          .on('mouseout', function(d) {
            tooltip.transition().duration(500).style('opacity', 0);
            chart.selectAll('rect').filter(function(d2) { return d2.record_category_id == d.record_category_id; }).attr('fill', d.color || '#ccc');
          })
        ;

      });

    }
  };
});

