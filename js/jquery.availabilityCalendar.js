(function($) {
  var settings = {
    nbDaysToShow: 7,
    periodsPerHour: 4,
    heightOfPeriod: 20,
    hourMin: 0,
    hourMax: 24,
    showControls: false,
    showDayDates: false,
    fullDaySelector: false,
    selectionEnabled: false,
    dateChangeCallback: null,
    
    weekdayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };
  
  var data = {
    availabilities: [],
    unavailabilities: []
  };
  
  var methods = {
    init : function( options ) {
      return this.each(function() {
        var new_settings = new Object();
        $.extend(new_settings, settings, options);

        var elem = $(this);
        
        var curr = new Date();
        var first = curr.getDate() - curr.getDay();
        var date = new Date(curr.setDate(first));
        
        var html = '<div class="ac-container">';
        
        if(new_settings.showControls) {
          html += '<div class="ac-controls">';
          html +=   '<div class="button go-prev"><</div>';
          html +=   '<div class="top-date-range"></div>';
          html +=   '<div class="button go-next">></div>';
          html += '</div>';
        }
        
        html += '<div class="ac-calendar">';
        html += '</div>';
        html += '</div>';
        
        elem.html(html);
        elem.css("overflow", "hidden");
        
        elem.data('settings', new_settings);

        methods.setDate(date, elem);

        var calendar = elem.find('.ac-calendar');
        // Update dimansions and plugin for selecting when resizing window
        calendar.resize(function() {
          methods._updateDimensions(elem);
          methods._setupSelection(elem);
        })
        
        calendar.disableSelection();
        
        elem.find('.go-prev').click(function() {
          var date = elem.data('currentDate');
          date.setDate(date.getDate() - 7);
          methods.setDate(date, elem);
        });
        
        elem.find('.go-next').click(function() {
          var date = elem.data('currentDate');
          date.setDate(date.getDate() + 7);
          methods.setDate(date, elem);
        });
      });
    },
    
    update: function(elem, skip_callback) {
      if(!elem) {
        elem = $(this);
      }
      methods.setDate(elem.data('currentDate'), elem, skip_callback);
    },
    
    updateAll: function(elem) {
      if(!elem) {
        elem = $(this);
      }
      
      methods.update(elem, true);
      methods.setAvailabilities(data.availabilities, elem);
      methods.setUnavailabilities(data.unavailabilities, elem);
    },
    
    clear: function(elem) {
      if(!elem) {
        elem = $(this);
      }
      var calendar = elem.find('.ac-calendar');
      data.availabilities = [];
      data.unavailabilities = [];
    },
    
    setDate: function(date, elem, skip_callback) {
      if(!elem) {
        elem = $(this);
      }
      
      var settings = elem.data('settings');
      
      var calendar = elem.find('.ac-calendar');
      elem.data('currentDate', methods._cloneDate(date));
      
      var temp_date = methods._cloneDate(date);
      
      var html = '<div class="ac-top-container"><table class="ac-top" cellspacing="0" cellpadding="0">';
      html += '<tr>';
      html +=   '<td class="ac-top-hours-col"></td>';
      var today = new Date();
      for(var i = 0; i < settings.nbDaysToShow; i++) {
        // Check whether it is today
        html += '<td class="ac-top-day';
        if(settings.showDayDates && date.getFullYear() == today.getFullYear() && date.getMonth() == today.getMonth() && date.getDate() == today.getDate()) {
          html += ' today';
        }
        
        html += '" data-day="';
        if(settings.showDayDates) {
          html += methods._formattedDate(date);
        } else {
          html += (i + 1);
        }        
        html += '">';
        html += '<div class="ac-top-day-content">';
        html += '<div class="ac-top-day-name">';
        if(settings.showDayDates) {
          html += settings.weekdayNamesShort[i%7];
          if(settings.fullDaySelector) {
            html += '<div class="ac-top-day-date"><label>' + methods._formattedDateDay(date, elem) + '<input class="ac-all-day" type="checkbox" /></label></div>';
          } else {
            html += '<div class="ac-top-day-date">' + methods._formattedDateDay(date, elem) + '</div>';
          }
        } else {
          
          if(settings.fullDaySelector) {
            html += '<label>' + settings.weekdayNamesShort[i%7] + '<input class="ac-all-day" type="checkbox" /></label>';
          } else {
            html += settings.weekdayNamesShort[i%7];
          }
        }
        html += '</div>';
        
        html += '</div>';
        html += '</td>';
        date.setDate(date.getDate() + 1);
      }
      html += '</tr>';
      html += '</table></div>';

      // Change date range title of calendar
      date.setDate(date.getDate() - 1);
      calendar.parents('.ac-container').find('.top-date-range').html(methods._formattedDateRange(temp_date, date, elem));
      
      html += '<div class="ac-content-container"><table class="ac-content" cellspacing="0" cellpadding="0">';
      html += '<tr>';
      html += '<td class="ac-hours-col">';
      
      var time = new Date(0);
      time.setHours(settings.hourMin);
      for(var i = settings.hourMin; i < settings.hourMax; i++) {
        html += '<div class="ac-hour-cell"><div class="ac-hour-cell-content">' + methods._formattedTime(time) + '</div></div>';
        time.setHours(time.getHours() + 1);
      }
      html += '</td>'

      var minutes_per_period = 60 / settings.periodsPerHour;
      for(var i = 0; i < settings.nbDaysToShow; i++) {
        html += '<td class="ac-day-col" data-day="';
        if(settings.showDayDates) {
          html += methods._formattedDate(temp_date);
        } else {
          html += (i + 1);
        }      
        html += '">';
        var nbPeriods = (settings.hourMax - settings.hourMin) * settings.periodsPerHour;
        var period_time = new Date();
        period_time.setUTCHours(settings.hourMin);
        period_time.setUTCMinutes(0);
        for(var j = 0; j < nbPeriods; j++) {
          html += '<div class="ac-period-cell" data-time="' + period_time.getUTCHours() + ':' + ("0" + period_time.getUTCMinutes()).slice(-2) + '"></div>';
          period_time.setUTCMinutes(period_time.getUTCMinutes() + minutes_per_period);
        }
        html += '</td>'
        temp_date.setDate(temp_date.getDate() + 1);
      }
        
      
      html += '</tr>';
      html += '</table></div>';
      
      calendar.html(html);
      
      // Arrange height
      var cell = calendar.find('.ac-period-cell');
      cell.height(settings.heightOfPeriod - 1);
      var margin = cell.outerHeight(true) - cell.height();
      calendar.find('.ac-hour-cell').height(settings.periodsPerHour * (settings.heightOfPeriod - 1) + (settings.periodsPerHour - 1) * margin);
      calendar.find('.ac-period-cell:nth-child(' + settings.periodsPerHour + 'n)').addClass('ac-period-cell-border');
      
      // Set selection actions
      methods._updateDimensions(elem);
      methods._setupSelection(elem);
      
      if(!skip_callback && settings.dateChangeCallback) {
        // Update temp_date because it was set to the day after the currently shown dates
        temp_date.setDate(temp_date.getDate() - 1);
        settings.dateChangeCallback(methods._formattedDate(elem.data('currentDate')), methods._formattedDate(temp_date));
      }
    },
    
    options: function(options, elem) {
      if(!elem) {
        elem = $(this);
      }
      
      $.extend(elem.data('settings'), options);
    },
    
    getOption: function(option_name) {
      return ($(this).data('settings'))[option_name];
    },
    
    _setPeriods: function(periods, class_to_set, elem) {
      if(!elem) {
        elem = $(this);
      }
      
      var settings = elem.data('settings');
      
      for(var i in periods) {
        var col = elem.find('.ac-day-col[data-day=' + i + ']');
        for(var j=0; j < periods[i].length; j++) {
          var start_hour = parseInt(periods[i][j].start / 60);
          var end_hour = parseInt(periods[i][j].end / 60);
          var start_time = start_hour + ':' + ("0" + (periods[i][j].start % 60)).slice(-2);
          var end_time = end_hour + ':' + ("0" + (periods[i][j].end % 60)).slice(-2);
          
          var index_start = col.find('.ac-period-cell[data-time="' + start_time + '"]').index();
          
          var ending_period = settings.hourMax + ':00';
          var index_end = col.find('.ac-period-cell[data-time="' + end_time + '"]').index();
          
          var nb_periods = col.find('.ac-period-cell').length;
          
          if(index_start == -1) {
            if(start_hour <= settings.hourMin && end_hour > settings.hourMin) {
              index_start = 0;
            }
          }
          if(index_end == -1) {
            if(end_hour >= settings.hourMax && start_hour < settings.hourMax) {
              index_end = nb_periods;
            }
          }
          
          if(index_start >= 0 && index_end >= 0) {
  
            var period = col.find('.ac-period-cell:eq(' + (index_start) + ')');
            period.addClass(class_to_set);
              
            if(end_time >= nb_periods) {
              period.nextAll().addClass(class_to_set);
            } else {
              period.nextAll().slice(0, index_end - index_start - 1).addClass(class_to_set);
            }
          }
        }
      }
    },
    
    _clearPeriods: function(class_to_remove, elem) {
      elem.find('.ac-period-cell').removeClass(class_to_remove);
    },
    
    _getPeriods: function(class_to_find, elem) {
      var periods = {};
      var cols = elem.find('.ac-day-col');
      var settings = elem.data('settings');
      
      for(var col_id = 0; col_id < cols.length; col_id++) {
        var col = $(cols.get(col_id));
        var day_availabilities = new Array();
        var avail_periods = col.find('.ac-period-cell.' + class_to_find);
        for(var p_id = 0; p_id < avail_periods.length; p_id++) {
          var period_elem = $(avail_periods[p_id]);
          var period = period_elem.attr('data-time').split(':');
          day_availabilities.push(parseInt(period[0]) * 60 + parseInt(period[1]));
        }

        // Merge periods following each other
        var minutes_per_period = 60 / settings.periodsPerHour;
        var rstart, rend;
        for (var i = 0; i < day_availabilities.length; i++) {
          rstart = day_availabilities[i];
          rend = rstart;
          while (day_availabilities[i + 1] - day_availabilities[i] == minutes_per_period) {
            rend = day_availabilities[i + 1];
            i++;
          }

          if(!periods[col.attr('data-day')]) {
            periods[col.attr('data-day')] = new Array();
          }
          
          periods[col.attr('data-day')].push({
            start: rstart,
            end: rend + minutes_per_period
          });
        }
      }
      
      return periods;
    },
    
    getPeriodsByClass: function(period_class, elem) {
      if(!elem) {
        elem = $(this);
      }
      return methods._getPeriods(period_class, elem);
    },
    
    getAvailabilities: function(elem) {
      if(!elem) {
        elem = $(this);
      }

      return methods._getPeriods('available', elem);
    },
    
    addAvailabilities: function(availabilities, elem) {
      if(!elem) {
        elem = $(this);
      }

      for(var date in availabilities) {
        if(!data.availabilities[date]) {
          data.availabilities[date] = availabilities[date];
        } else {
          data.availabilities[date] = data.availabilities[date].concat(availabilities[date]);
        }
      }

      methods._setPeriods(data.availabilities, 'available', elem);
    },
    
    setAvailabilities: function(availabilities, elem) {
      if(!elem) {
        elem = $(this);
      }

      methods._clearPeriods('available', elem);
      data.availabilities = [];
      data.availabilities = availabilities;

      methods._setPeriods(data.availabilities, 'available', elem);
    },
    
    getUnavailabilities: function(elem) {
      if(!elem) {
        elem = $(this);
      }

      return methods._getPeriods('unavailable', elem);
    },
    
    setUnavailabilities: function(unavailabilities, elem) {
      if(!elem) {
        elem = $(this);
      }

      methods._clearPeriods('unavailable', elem);
      data.unavailabilities = [];
      data.unavailabilities = unavailabilities;
      methods._setPeriods(data.unavailabilities, 'unavailable', elem);
    },
    
    _updateDimensions: function(elem) {
      var settings = elem.data('settings');
      
      var calendar = elem.find('.ac-calendar');
      var calendar_width = calendar.width();
      var top_table = calendar.find('.ac-top');
      top_table.width(calendar_width);
      
      var content_table = calendar.find('.ac-content');
      content_table.width(calendar_width);
      
      calendar.find('.ac-content-container').height(elem.height() - elem.find('.ac-controls').outerHeight() - calendar.find('.ac-top-container').height())
      
      var scrollbarWidth = 0;
      if(calendar.find('.ac-content-container').height() < content_table.height()) {
        // There is no scrollbar
        scrollbarWidth = $.getScrollbarWidth();
      } 
      
      var first_col_width = content_table.find('td').first().width();
      
      var cal_content_width = calendar_width - first_col_width - scrollbarWidth;
      
      var col_width = Math.floor((cal_content_width - settings.nbDaysToShow /* for borders */) / settings.nbDaysToShow);;
      var remaining_width = cal_content_width - (settings.nbDaysToShow + (col_width * settings.nbDaysToShow));
      
      var first_col_final_width = elem.find('.ac-top-hours-col').width() + remaining_width;
      elem.find('.ac-top-hours-col').width(first_col_final_width);
      elem.find('.ac-hours-col').width(first_col_final_width);

      var content_cols = elem.find('.ac-day-col');
      content_cols.width(col_width);
      var last_content_col = content_cols.last();
      last_content_col.width(col_width + scrollbarWidth);
      
      var top_cols = elem.find('.ac-top-day');
      top_cols.width(col_width);
      var last_col = top_cols.last();
      last_col.width(col_width + scrollbarWidth);
      last_col.children('.ac-top-day-content').css('padding-right', scrollbarWidth + 'px');
    },
    
    _setupSelection: function(elem) {
      var settings = elem.data('settings');
      var calendar = elem.find('.ac-calendar');
      
      if(settings.selectionEnabled) {
        calendar.removeClass('disabled');
        $selection_started = false;
        var position_start = null;
        $remove = false;
        
        calendar.find('.ac-period-cell').click(function() {
          $(this).toggleClass("available");
          methods._updateCheckboxes(elem);
          methods.setAvailabilities(methods.getAvailabilities(elem), elem);
        });
  
        var max_height = calendar.offset().top + calendar.height();
        var max_width = calendar.offset().left + calendar.width();
        $will_remove = false;
        
        // Set drag
        calendar.find('.ac-day-col')
        .drag("start", function( ev, dd ){
          var elem = $(ev.target);
          if(!elem.hasClass('unavailable')) {
            if(elem.hasClass('available')) {
              $will_remove = true;
            }
            return $('<div class="selection" />')
              .css('opacity', .65 )
              .appendTo( document.body );
          }
          return false;
        })
        .drag(function( ev, dd ){
          var right_limit = Math.min(max_width, ev.pageX);
          var bottom_limit = Math.min(max_height, ev.pageY);
          $( dd.proxy ).css({
            top: Math.min( bottom_limit, dd.startY ),
            left: Math.min( right_limit, dd.startX ),
            height: Math.abs( bottom_limit - dd.startY ),
            width: Math.abs( right_limit - dd.startX )
          });
        })
        .drag("end",function( ev, dd ){
          $will_remove = false;
          $(dd.proxy).remove();
          methods.setAvailabilities(methods.getAvailabilities(elem), elem);
        });
        
        // Set drop
        calendar.find('.ac-period-cell')
        .drop("start", function() {
          if(!$(this).hasClass('unavailable')) {
            if($will_remove) {
              $(this).addClass("active rm");
            } else {
              $(this).addClass("active");
            }
          }
        })
        .drop(function(ev, dd) {
          if(!$(this).hasClass('unavailable')) {
            if($will_remove) {
              $(this).removeClass("available");
            } else {
              $(this).addClass("available");
            }
          }
        })
        .drop("end", function() {
          if(!$(this).hasClass('unavailable')) {
            $(this).removeClass("active rm");
            
            // Update checkboxes for day selection
            methods._updateCheckboxes(elem);
          }
        });
        
        $.drop({
          multi: true
        });
        
        
        // Set all day selection
        calendar.find('.ac-all-day')
        .unbind('click')
        .click(function() {
          // Index of day selected from left to right
          var index = $(this).parents('.ac-top-day').index();
          var day_col = calendar.find('.ac-day-col').get(index - 1);
          var cells = $(day_col).find('.ac-period-cell:not(.unavailable)');
          if($(this).is(":checked")) {
            cells.addClass('available');
          } else {
            cells.removeClass('available');
          }
        });
      } else {
        calendar.addClass('disabled');
      }
    },
    
    _updateCheckboxes: function(elem) {
      elem.find('.ac-all-day:checked').each(function() {
        var index = elem.find('.ac-all-day').index(this);
        var day_col = elem.find('.ac-day-col').get(index);
        if($(day_col).find('.ac-period-cell:not(".available")').length > 0) {
          $(this).attr('checked', false);
        }
      });
    },
    
    _cloneDate: function(date) {
      return new Date(date.getTime());
    },
    
    _formattedDate: function(date) {
      return date.getFullYear() + '-' + ("0" + (date.getMonth() + 1)).slice(-2) + '-' + ("0" + date.getDate()).slice(-2);
    },
    
    _formattedDateDay: function(date, elem) {
      var settings = elem.data('settings');
      return settings.monthNamesShort[date.getMonth()] + ' ' + date.getDate();
    },
    
    _formattedDateRange: function(date1, date2, elem) {
      var settings = elem.data('settings');
      
      var show_year = true;
      var show_month = true;
      if(date1.getFullYear() == date2.getFullYear()) {
        show_year = false;
        
        if(date1.getMonth() == date2.getMonth()) {
          show_month = false;
        }
      }
      
      var date_range = settings.monthNamesShort[date1.getMonth()] + ' ' + date1.getDate();
      date_range += ((show_year)?', ' + date1.getFullYear():'');
      date_range += ' - ' + ((show_month)?settings.monthNamesShort[date2.getMonth()] + ' ':'') + date2.getDate() + ', ' + date2.getFullYear();
      return date_range;
    },
    
    _formattedTime: function(time) {
      var suffix = 'AM';
      var number = time.getHours();
      if(number >= 12) {
        number -= 12;
        suffix = 'PM';
      }
      if(number == 0) {
        number = 12;
      }
      return number + ' ' + suffix;
    }
  };
  
  $.fn.availabilityCalendar = function( method ) {
    // Method calling logic
    if ( methods[method] ) {
      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
    }    
  
  };
})( jQuery );