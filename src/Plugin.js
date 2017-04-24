import $ from 'jquery';
import Gantt from './Gantt';

const other = $.fn.gantt;

$.fn.gantt = function (options) {
  return this.each(function () {
    if (!$.data(this, 'plugin_Gantt')) {
      $.data(this, 'plugin_Gantt',
        new Gantt($(this), options),
      );
    }
  });
};

$.fn.gantt.version = '1.0.0';
$.fn.gantt.l10n = Gantt.LANGUAGES;
$.fn.gantt.setDefaults = Gantt.setDefaults;

// No conflict
$.fn.gantt.noConflict = function () {
  $.fn.gantt = other;
  return this;
};
