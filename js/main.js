$(document).ready(function() {

  var calendar = $('#calendar').availabilityCalendar({
    periodsPerHour: 2,
    nbDaysToShow: 7,
    heightOfPeriod: 30,
    hourMin: 8,
    hourMax: 17,
    showControls: true,
    showDayDates: true,
    fullDaySelector: false,
    selectionEnabled: true
  });
  
  $('#calendar').availabilityCalendar('setAvailabilities', {
    '1': [{start: 600, end: 720},{start: 780, end: 840}],
    '2': [{start: 480, end: 1020}],
    '3': [{start: 600, end: 720}],
    '4': [{start: 780, end: 840}],
    '5': [{start: 480, end: 660}],
    '6': [{start: 600, end: 660}],
    '7': [{start: 720, end: 780}]
  });
  
  $('input[name=enable_selection]').change(function() {
    var calendar = $('#calendar');
    calendar.availabilityCalendar('options', {selectionEnabled: ($('input[name=enable_selection]:checked').val() == 1)?true:false});
    calendar.availabilityCalendar('updateAll');
  });
  
  
  //Slider
  var time_range = $('#maxMin-slider');
  time_range.noUiSlider('init', {
    step: 1,
    scale: [0, 24],
    start: [calendar.availabilityCalendar('getOption', 'hourMin'), calendar.availabilityCalendar('getOption', 'hourMax')],
    click: false,
    change: function(){
      var elem = $(this);
      var values = elem.noUiSlider('value');
      elem.find('.noUi-lowerHandle .infoBox').text(formattedTimeWithHours(values[0]));
      elem.find('.noUi-upperHandle .infoBox').text(formattedTimeWithHours(values[1]));
    
      calendar.availabilityCalendar('options', {hourMin: values[0], hourMax: values[1]});
      calendar.availabilityCalendar('updateAll');
    }
  }).find('.noUi-handle div').each(function(index){
    var elem = $(this);
    elem.append('<div class="infoBox">' + formattedTimeWithHours(elem.parent().parent().noUiSlider('value')[index]) + '</div>');
  });
  
  time_range.noUiSlider('move', {
    handle: 0,
    to: calendar.availabilityCalendar('getOption', 'hourMin')
  });
  time_range.noUiSlider('move', {
    handle: 1,
    to: calendar.availabilityCalendar('getOption', 'hourMax')
  });
  
  $('#period_length').change(function() {
    var calendar = $('#calendar');
    calendar.availabilityCalendar('options', {'periodsPerHour': $(this).val()});
    calendar.availabilityCalendar('update');
  });
  
  $('#addAvailabilities').click(function() {
    var date_to_add = $('#date').val();
    var start = $('#start').val();
    var end = $('#end').val();
    
    var start_array = start.split(':');
    var end_array = end.split(':');
    var date = {};
    date[date_to_add] = new Array();
    date[date_to_add].push({start: parseInt(start_array[0] * 60) + parseInt(start_array[1]), end: parseInt(end_array[0] * 60) + parseInt(end_array[1])});
    
    $('#calendar').availabilityCalendar('addAvailabilities', date);
    $('#calendar').availabilityCalendar('updateAll');
  });
  
  $('#getAvailabilities').click(function() {
    var a = $('#calendar').availabilityCalendar('getAvailabilities');
    
    var html = '<ul>';
    for(var i in a) {
      html += '<li><strong>' + i + '</strong>';
      for(var j=0; j < a[i].length; j++) {
        html += '<div>' + JSON.stringify(a[i][j]) + '</div>';
      }
      html += '</li>';
    }
    
    html += '</ul>';
    $('#availabilities').html(html);
  })
});

function formattedTimeWithHours(hour) {
  var suffix = 'AM';
  if(hour >= 12) {
    hour -= 12;
    suffix = 'PM';
  }
  if(hour == 0) {
    hour = 12;
  }
  return hour + ' ' + suffix;
}