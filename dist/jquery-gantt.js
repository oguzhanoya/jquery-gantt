/*!
   * Gantt v1.0.0
   * https://github.com/oguzhanoya/jquery-gantt
   *
   * Copyright (c) 2017 oguzhanoya
   * Released under the MIT license
   */
  
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('jquery')) :
	typeof define === 'function' && define.amd ? define(['jquery'], factory) :
	(factory(global.$));
}(this, (function ($$1) { 'use strict';

$$1 = 'default' in $$1 ? $$1['default'] : $$1;

var DEFAULTS = {
  // user defined data array of event [source]
  data: [],
  // data URL
  dataURL: '',
  // start date calendar
  startDate: new Date(),
  // end date calendar
  endDate: new Date(),
  // cell width px
  cellWidth: 20,
  // cell height px
  cellHeight: 38,
  // language
  language: 'en',
  // sticky header
  stickyHeader: false,
  // mouse scroll
  mouseScroll: false,
  // mouse scroll px
  mouseScrollpx: 120,
  // lazy load
  lazyLoad: false,
  // auto hide
  autoHide: false,
  // onInit event
  onInit: $.noop,
  // onDestroy event
  onDestroy: $.noop
};

var lazyload = {
  buildData: function buildData() {
    var url = this.config.dataURL;
    return $$1.ajax({
      url: url,
      dataType: 'jsonp',
      jsonp: 'callback',
      crossDomain: true,
      contentType: 'application/json'
    });
  },
  initLazyLoad: function initLazyLoad() {
    var startDate = this.config.startDate;
    var endDate = this.config.endDate;
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    this.scrollHandler();
  },
  renderLazyLoad: function renderLazyLoad(data, startDate, endDate) {
    this.renderLazyLoadGrid(data, startDate, endDate);
    var el = $$1(this.element);
    var templateHeaderMonths = $$1('.gantt-header-months', el);
    var templateHeaderDays = $$1('.gantt-header-days', el);
    var templateHeaderDaysMin = $$1('.gantt-header-days-min', el);

    // difference between start-date and end-date
    var num = this.dateDiffInDays(startDate, endDate);
    this.renderLazyLoadEvents(data, num);

    for (var i = 0; i <= num; i += 1) {
      var templateHeaderMonth = $$1('<div>', { class: 'gantt-header-month' });
      var templateHeaderDay = $$1('<div>', { class: 'gantt-header-day' });
      var templateHeaderDayMin = $$1('<div>', { class: 'gantt-header-day-min' });

      // const weekOfday = startDate.getDay();
      var day = startDate.getDate();
      var month = startDate.getMonth() + 1;
      var year = startDate.getFullYear();
      var monthWidth = this.daysInMonth(month, year) * this.config.cellWidth;
      // const weekOfdayName = this.config.region.dayNamesMin[weekOfday];
      var monthName = this.config.region.monthNames[month - 1];

      var dayTemplate = $$1(templateHeaderDay).text(day).css('width', this.config.cellWidth);
      // const dayMinTemplate = $(templateHeaderDayMin).text(weekOfdayName)
      //  .css({ width: this.config.cellWidth });
      var monthTemplate = $$1(templateHeaderMonth).text(monthName + ' ' + year).css({ width: monthWidth });

      templateHeaderDays.append(dayTemplate);
      templateHeaderDaysMin.append(templateHeaderDayMin);

      var firstMonthIsNotFull = i === 0;

      var firstDay = this.firstDayMonth(year, month);
      firstDay.setHours(0, 0, 0, 0);
      var firstDayEndDateMonth = this.firstDayMonth(this.config.endDate.getFullYear(), this.config.endDate.getMonth() + 1);
      firstDayEndDateMonth.setHours(0, 0, 0, 0);

      var checkFirstDayMonth = this.isEqual(startDate, firstDay);
      var checkFirstDayMonthEndDate = this.isEqual(startDate, firstDayEndDateMonth);

      if (checkFirstDayMonth || firstMonthIsNotFull) {
        if (firstMonthIsNotFull) {
          monthWidth -= (day - 1) * this.config.cellWidth;
        }

        if (checkFirstDayMonthEndDate) {
          monthWidth = this.config.endDate.getDate() * this.config.cellWidth;
        }

        // var monthName = this.config.region.monthNames[month - 1];
        // var monthTemplate = $(templateHeaderMonth).text(`${monthName} ${year}`)
        //  .css({ width: monthWidth });

        templateHeaderMonths.append(monthTemplate);
      }

      startDate.setDate(startDate.getDate() + 1);
    }

    var totalWidth = $$1('.gantt-header-day', el).length * this.config.cellWidth;
    $$1(templateHeaderMonths, el).css({ width: totalWidth });
    $$1(templateHeaderDays, el).css({ width: totalWidth });
    $$1(templateHeaderDaysMin, el).css({ width: totalWidth });

    var templateGrid = $$1('.gantt-grid', el);
    $$1(templateGrid, el).css({ width: totalWidth });

    var templateGridRow = $$1('.gantt-grid-row', el);
    $$1(templateGridRow, el).css({ width: this.gridDefaults.gridtotalWidth });

    var templateGridCol = $$1('.gantt-grid-col', el);
    $$1(templateGridCol, el).css({ height: this.gridDefaults.gridtotalHeight });

    $$1('.gantt-event-row', el).css({ width: this.gridDefaults.gridtotalWidth });

    this.gridDefaults.eventsWidth = this.gridDefaults.gridtotalWidth;
  },
  renderLazyLoadGrid: function renderLazyLoadGrid(data, startDate, endDate) {
    var el = $$1(this.element);
    // difference between start-date and end-date
    var num = this.dateDiffInDays(startDate, endDate);
    var totalWidth = this.getTotalWidth(num);
    var totalHeight = this.getTotalHeight(data.length);
    var templateGrid = $$1('.gantt-grid', el);
    var templateGridCols = $$1('.gantt-grid-cols', el);
    var templateGridRows = $$1('.gantt-grid-rows', el);

    var sDate = new Date(startDate.getTime());
    for (var i = 0; i <= num; i += 1) {
      var templateGridCol = $$1('<div>', { class: 'gantt-grid-col', width: this.config.cellWidth, height: totalHeight });

      // firefox width problem fix
      templateGridCol.css('width', this.config.cellWidth);

      var month = sDate.getMonth() + 1;
      var year = sDate.getFullYear();

      var lastDay = this.lastDayMonth(year, month);

      if (this.isEqual(sDate, lastDay)) {
        templateGridCol.css('border-color', '#bec5cc');
      }

      templateGridCols.append(templateGridCol);
      // eslint-disable-line no-redeclare
      sDate.setDate(sDate.getDate() + 1);
    }

    data.forEach(function () {
      var templateGridRow = $$1('<div>', { class: 'gantt-grid-row', width: totalWidth, height: this.config.cellHeight });
      templateGridRows.append(templateGridRow);
    }, this);

    templateGrid.append(templateGridCols).append(templateGridRows);

    this.gridDefaults.gridtotalWidth += totalWidth;
    this.gridDefaults.gridtotalHeight += totalHeight;
  },
  renderLazyLoadContainer: function renderLazyLoadContainer() {
    var template = $$1('<div>', { class: 'gantt-container' });
    var templateWrapper = $$1('<div>', { class: 'gantt-wrapper' });

    var templateHeader = $$1('<div>', { class: 'gantt-header' });
    var templateHeaderMonths = $$1('<div>', { class: 'gantt-header-months' });
    var templateHeaderDays = $$1('<div>', { class: 'gantt-header-days' });
    var templateHeaderDaysMin = $$1('<div>', { class: 'gantt-header-days-min' });

    var arrowLeft = '<div class="arrow arrow-left"><span class="arrow-icon"></span></div>';
    var arrowRight = '<div class="arrow arrow-right"><span class="arrow-icon"></span></div>';

    var templateGrid = $$1('<div>', { class: 'gantt-grid' });
    var templateEvents = $$1('<div>', { class: 'gantt-events' });

    var templateLoading = $$1('<div>', { class: 'gantt-loading', style: 'display: none' });

    templateHeader.append($$1(templateHeaderMonths));
    templateHeader.append($$1(templateHeaderDays));
    templateHeader.append($$1(templateHeaderDaysMin));

    var templateGridCols = $$1('<div>', { class: 'gantt-grid-cols' });
    var templateGridRows = $$1('<div>', { class: 'gantt-grid-rows' });

    templateGrid.append(templateGridCols).append(templateGridRows);

    template.append(templateHeader).append(templateGrid).append(templateEvents);
    templateWrapper.append(arrowLeft).append(template).append(arrowRight).append(templateLoading);
    return templateWrapper;
  },
  renderLazyLoadEvents: function renderLazyLoadEvents(data) {
    var el = $$1(this.element);
    var templateEvents = $$1('.gantt-events', el);

    data.forEach(function (element) {
      var itemStartDate = new Date(element.startdate);

      var templateEventRow = $$1('<div>', { class: 'gantt-event-row', width: this.totalWidth });
      var templateEvent = $$1('<div>', { class: 'gantt-event' });

      var tourWidth = (parseInt(element.minNight, 10) + 1) * this.config.cellWidth;
      var remDay = this.dateDiffInDays(this.config.startDate, itemStartDate);

      var tooltipData = $$1.extend(element.tooltipData, { price: element.price });

      var tourType = '';
      if (element.type === 'Tur') {
        tourType = 'tourFly';
      } else if (element.type === 'TurBus') {
        tourType = 'tourBus';
      } else {
        tourType = 'cruise';
      }

      var title = element.minNight + ' Gece';

      var eventBlock = $$1('<a>', {
        class: this.format('gantt-event-block {0}', tourType),
        width: tourWidth + 'px',
        href: '/' + element.url,
        target: '_blank'
      }).text(title).css('line-height', this.config.cellHeight - 28 + 'px').data('tooltip', this.tooltipView(tooltipData));

      var eventIcon = $$1('<div class="gantt-event-icon"><div class="' + tourType + '"></div></div>');

      var eventPrice = $$1('<div>', {
        class: 'gantt-event-price'
      }).text(element.price.original.price + ' ' + element.price.original.priceType);

      var eventDesc = $$1('<div>', {
        class: 'gantt-event-desc'
      }).text(element.title);

      var left = remDay * this.config.cellWidth + this.gridDefaults.eventsWidth;

      templateEventRow.append(templateEvent.css('left', left).append(eventBlock).append(eventIcon).append(eventPrice).append(eventDesc)).css('height', this.config.cellHeight);

      templateEvents.append(templateEventRow);
    }, this);

    return templateEvents;
  }
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var Gantt = function () {
  function Gantt(element, options) {
    classCallCheck(this, Gantt);

    var gridDefaults = {
      gridtotalHeight: 0,
      gridtotalWidth: 0,
      eventsWidth: 0
    };
    var lang = options.language || DEFAULTS.language;
    // eslint-disable-next-line no-param-reassign
    options.lang = Gantt.LANGUAGES[lang];
    // extend defaults with the init options.
    this.config = $$1.extend({}, DEFAULTS, options);
    // grid defaults
    this.gridDefaults = $$1.extend({}, gridDefaults);
    // store main DOM element.
    this.element = element;
    // no data source
    if (this.config.dataURL === '' && this.config.data.length <= 0) console.warn('jquery-gantt: must provide a data source');
    // dataURL is required
    else if (this.config.dataURL === '' && this.config.lazyLoad) console.warn('jquery-gantt: dataURL is required for lazyLoad');
      // initialize
      else {
          this.init();
        }
  }

  createClass(Gantt, [{
    key: 'init',
    value: function init() {
      var _this = this;

      this.hook('onInit');
      var html = '';
      // erasing all the content from the container
      $$1(this.element).html(html);

      if (this.config.endDate.getTime() > this.config.startDate.getTime()) {
        // lazy load
        if (this.config.lazyLoad) {
          this.initLazyLoad();
          html = this.renderLazyLoadContainer();
        } else if (this.config.data.length <= 0 && this.config.dataURL !== '') {
          this.buildData().then(function (data) {
            _this.config.data = data.Items;
            html = _this.renderContainer();
            $$1(_this.element).html(html);
            _this.attachEvents(_this.element, _this.config);
            _this.tooltipHover();
            _this.colHighlighter();
          });
        } else {
          html = this.renderContainer();
        }

        if (this.config.data.length > 0 || this.config.lazyLoad) {
          $$1(this.element).html(html);
          this.attachEvents(this.element, this.config);
          this.tooltipHover();
          this.colHighlighter();
        }
      } else {
        console.warn('jquery-gantt: start-date is not greater than end-date');
      }
    }
  }, {
    key: 'hook',
    value: function hook(hookName) {
      if (this.config[hookName] !== undefined) {
        this.config[hookName].call(this.el);
      }
    }
  }, {
    key: 'attachEvents',
    value: function attachEvents(el, options) {
      // sticky header
      if (options.stickyHeader) {
        var stickyH = function stickyH() {
          var top = $$1('.gantt-wrapper', el).offset().top;
          var height = $$1('.gantt-wrapper', el).height();
          if (top >= $$1(this).scrollTop() || $$1(this).scrollTop() >= top + height - 80) {
            $$1('.gantt-header', el).css('position', 'static');
            $$1('.arrow', el).css('position', 'static');
          } else {
            $$1('.arrow', el).css({
              position: 'relative',
              top: $$1(this).scrollTop() - top + 'px'
            });
            $$1('.gantt-header', el).css({
              position: 'relative',
              top: $$1(this).scrollTop() - top + 'px',
              left: $$1(this).scrollLeft + 'px',
              'z-index': 1
            });
          }
        };
        $$1(window).scroll(stickyH);
      }
      // scroll page horizontally with mouse wheel
      if (options.mouseScroll) {
        $$1('.gantt-container', el).on('wheel mousewheel', function (e) {
          if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
            this.scrollLeft -= options.mouseScrollpx;
          } else {
            this.scrollLeft += options.mouseScrollpx;
          }
        });
      }
      if (options.lazyLoad) {
        var self = this;
        var loading = false;
        $$1('.gantt-container', el).scroll(function () {
          if (this.scrollWidth - this.clientWidth - this.scrollLeft < 900 && !loading) {
            loading = true;
            self.scrollHandler(function () {
              loading = false;
            });
          }
        });
      }
      // scroll drag
      $$1('.gantt-container', el).on('mousedown', function (event) {
        $$1(this).data('down', true).data('x', event.clientX).data('scrollLeft', this.scrollLeft).addClass('dragging');
        return false;
      }).on('mouseup', function () {
        $$1(this).data('down', false).removeClass('dragging');
      }).on('mousemove', function (event) {
        if ($$1(this).data('down') === true) {
          this.scrollLeft = $$1(this).data('scrollLeft') + $$1(this).data('x') - event.clientX;
        }

        if (options.autoHide) {
          var sl = this.scrollLeft;
          var daywidth = sl / options.cellWidth;
          daywidth = Math.floor(daywidth);

          var cWidth = daywidth * options.cellWidth;

          var events = $$1('.gantt-events', el).find('.gantt-event');
          $$1.each(events, function (index, elem) {
            var eventLeft = $$1(elem).css('left');
            eventLeft = parseInt(eventLeft, 10);
            if (eventLeft <= cWidth) {
              $$1(elem).closest('.gantt-event-row').hide();
            } else {
              $$1(elem).closest('.gantt-event-row').show();
            }
          });

          var currentDay = new Date(options.startDate.getTime());
          currentDay.setDate(currentDay.getDate() + daywidth);
        }
      }).on('mouseleave', function () {
        $$1(this).data('down', false).removeClass('dragging');
      });

      // arrow button click
      $$1('.arrow', el).on('click', function () {
        var direction = $$1(this).hasClass('arrow-right');
        var scrollLeft = $$1('.gantt-container', el).scrollLeft();
        if (direction) {
          $$1('.gantt-container', el).scrollLeft(scrollLeft + 240);
        } else {
          $$1('.gantt-container', el).scrollLeft(scrollLeft - 240);
        }
      });
    }
  }, {
    key: 'xhrRequest',
    value: function xhrRequest(startDate, endDate) {
      var self = this;
      var el = $$1(this.element);
      var url = this.config.dataURL;
      return $$1.ajax({
        url: url,
        dataType: 'jsonp',
        jsonp: 'callback',
        contentType: 'application/json',
        crossDomain: true,
        data: {
          startDate: self.getFormattedDate(startDate),
          endDate: self.getFormattedDate(endDate)
        },
        beforeSend: function beforeSend() {
          $$1('.gantt-loading', el).fadeIn();
        }
      });
    }
  }, {
    key: 'scrollHandler',
    value: function scrollHandler(callback) {
      var self = this;
      var el = $$1(this.element);

      var startDate = this.config.startDate;
      var nextDate = new Date(this.config.startDate.getTime());

      nextDate.setMonth(nextDate.getMonth() + 2);

      var month = nextDate.getMonth() + 1;
      var year = nextDate.getFullYear();
      nextDate = this.lastDayMonth(year, month);

      var monthEndDate = this.config.endDate.getMonth() + 1;
      var yearEndDate = this.config.endDate.getFullYear();
      var dayEndDate = this.config.endDate.getDate();

      if (year === yearEndDate || year > yearEndDate) {
        if (year > yearEndDate) {
          nextDate.setMonth(monthEndDate - 1);
          nextDate.setYear(yearEndDate);
          nextDate.setDate(dayEndDate);
        }
        if (month === monthEndDate || month > monthEndDate) {
          nextDate.setMonth(monthEndDate - 1);
          nextDate.setDate(dayEndDate);
        }
      }

      if (startDate.getTime() <= this.config.endDate.getTime()) {
        this.xhrRequest(startDate, nextDate).done(function (data) {
          self.renderLazyLoad(data.Items, startDate, nextDate);
          self.tooltipHover();
          self.colHighlighter();
          if (typeof callback === 'function') {
            callback();
          }
        }).always(function () {
          $$1('.gantt-loading', el).fadeOut();
        });
      }
    }
  }, {
    key: 'renderHeader',
    value: function renderHeader(num) {
      var templateHeader = $$1('<div>', { class: 'gantt-header' });
      var templateHeaderMonths = $$1('<div>', { class: 'gantt-header-months' });
      var templateHeaderDays = $$1('<div>', { class: 'gantt-header-days' });
      var templateHeaderDaysMin = $$1('<div>', { class: 'gantt-header-days-min' });

      var totalWidth = this.getTotalWidth(num);

      this.setHours();
      var startDate = new Date(this.config.startDate.getTime());

      for (var i = 0; i <= num; i += 1) {
        var templateHeaderMonth = $$1('<div>', { class: 'gantt-header-month' });
        var templateHeaderDay = $$1('<div>', { class: 'gantt-header-day' });
        var templateHeaderDayMin = $$1('<div>', { class: 'gantt-header-day-min' });

        var weekOfday = startDate.getDay();
        var day = startDate.getDate();
        var month = startDate.getMonth() + 1;
        var year = startDate.getFullYear();
        var monthWidth = this.daysInMonth(month, year) * this.config.cellWidth;

        var dayTemplate = $$1(templateHeaderDay).text(day).css('width', this.config.cellWidth);
        $$1(templateHeaderDays).append(dayTemplate);

        var weekOfdayName = this.config.lang.dayNamesMin[weekOfday];
        var dayMinTemplate = $$1(templateHeaderDayMin).text(weekOfdayName).css({ width: this.config.cellWidth });
        $$1(templateHeaderDaysMin).append(dayMinTemplate);

        var firstMonthIsNotFull = i === 0;

        var firstDay = this.firstDayMonth(year, month);
        var firstDayEndDateMonth = this.firstDayMonth(this.config.endDate.getFullYear(), this.config.endDate.getMonth() + 1);

        startDate.setHours(0, 0, 0, 0);
        var checkFirstDayMonth = this.isEqual(startDate, firstDay);
        var checkFirstDayMonthEndDate = this.isEqual(startDate, firstDayEndDateMonth);

        if (checkFirstDayMonth || firstMonthIsNotFull) {
          if (firstMonthIsNotFull) {
            monthWidth -= (day - 1) * this.config.cellWidth;
          }

          if (checkFirstDayMonthEndDate) {
            monthWidth = this.config.endDate.getDate() * this.config.cellWidth;
          }

          var monthName = this.config.lang.monthNames[month - 1];
          var monthTemplate = $$1(templateHeaderMonth).text(monthName + ' ' + year).css({ width: monthWidth });
          $$1(templateHeaderMonths).append(monthTemplate);
        }
        startDate.setDate(startDate.getDate() + 1);
      }

      templateHeader.append($$1(templateHeaderMonths).css('width', totalWidth));
      templateHeader.append($$1(templateHeaderDays).css('width', totalWidth));
      templateHeader.append($$1(templateHeaderDaysMin).css('width', totalWidth));
      return templateHeader;
    }
  }, {
    key: 'renderContainer',
    value: function renderContainer() {
      var template = $$1('<div>', { class: 'gantt-container' });
      var templateWrapper = $$1('<div>', { class: 'gantt-wrapper' });

      var arrowLeft = '<div class="arrow arrow-left"><span class="arrow-icon"></span></div>';
      var arrowRight = '<div class="arrow arrow-right"><span class="arrow-icon"></span></div>';

      // difference between start-date and end-date
      var diffInDays = this.dateDiffInDays(this.config.startDate, this.config.endDate);
      var templateHeader = this.renderHeader(diffInDays);
      var templateGrid = this.renderGrid(diffInDays);
      var templateEvents = this.renderEvents(diffInDays);

      template.append(templateHeader).append(templateGrid).append(templateEvents);
      templateWrapper.append(arrowLeft).append(template).append(arrowRight);
      return templateWrapper;
    }
  }, {
    key: 'renderGrid',
    value: function renderGrid(num) {
      var data = this.config.data;
      var totalWidth = this.getTotalWidth(num);
      var totalHeight = this.getTotalHeight(data.length);

      var templateGrid = $$1('<div>', { class: 'gantt-grid', width: totalWidth });
      var templateGridCols = $$1('<div>', { class: 'gantt-grid-cols' });
      var templateGridRows = $$1('<div>', { class: 'gantt-grid-rows' });

      var startDate = new Date(this.config.startDate.getTime());

      for (var i = 0; i <= num; i += 1) {
        var templateGridCol = $$1('<div>', { class: 'gantt-grid-col', width: this.config.cellWidth, height: totalHeight });

        // firefox width problem fix
        templateGridCol.css('width', this.config.cellWidth);

        var month = startDate.getMonth() + 1;
        var year = startDate.getFullYear();

        var lastDay = this.lastDayMonth(year, month);

        startDate.setHours(0, 0, 0, 0);
        if (this.isEqual(startDate, lastDay)) {
          templateGridCol.css('border-color', '#bec5cc');
        }

        templateGridCols.append(templateGridCol);
        startDate.setDate(startDate.getDate() + 1);
      }

      data.forEach(function () {
        var templateGridRow = $$1('<div>', { class: 'gantt-grid-row', width: totalWidth, height: this.config.cellHeight });
        templateGridRows.append(templateGridRow);
      }, this);

      templateGrid.append(templateGridCols).append(templateGridRows);

      return templateGrid;
    }
  }, {
    key: 'renderEvents',
    value: function renderEvents(num) {
      var data = this.config.data;
      var totalWidth = this.getTotalWidth(num);
      // const totalHeight = this.getTotalHeight(data.length);

      var templateEvents = $$1('<div>', { class: 'gantt-events', width: totalWidth });

      data.forEach(function (el) {
        var itemStartDate = new Date(el.startdate);

        var templateEventRow = $$1('<div>', { class: 'gantt-event-row', width: this.totalWidth });
        var templateEvent = $$1('<div>', { class: 'gantt-event' });

        var tourWidth = (parseInt(el.minNight, 10) + 1) * this.config.cellWidth;
        var remDay = this.dateDiffInDays(this.config.startDate, itemStartDate);

        var tooltipData = $$1.extend(el.tooltipData, { price: el.price });

        var tourType = '';
        if (el.type === 'Tur') {
          tourType = 'tourFly';
        } else if (el.type === 'TurBus') {
          tourType = 'tourBus';
        } else {
          tourType = 'cruise';
        }

        var title = el.minNight + ' Gece';

        var eventBlock = $$1('<a>', {
          class: 'gantt-event-block ' + tourType,
          width: tourWidth + 'px',
          href: '' + el.url,
          target: '_blank'
        }).text(title).css('line-height', this.config.cellHeight - 28 + 'px').data('tooltip', this.tooltipView(tooltipData));

        var eventIcon = $$1('<div class="gantt-event-icon"><div class="' + tourType + '"></div></div>');

        var eventPrice = $$1('<div>', {
          class: 'gantt-event-price'
        }).text(el.price.original.price + ' ' + el.price.original.priceType);

        var eventDesc = $$1('<div>', {
          class: 'gantt-event-desc'
        }).text(el.title);

        var left = remDay * this.config.cellWidth;

        templateEventRow.append(templateEvent.css('left', left).append(eventBlock).append(eventIcon).append(eventPrice).append(eventDesc)).css('height', this.config.cellHeight);

        templateEvents.append(templateEventRow);
      }, this);

      return templateEvents;
    }
  }, {
    key: 'getTotalWidth',
    value: function getTotalWidth(day) {
      return day === 0 ? 0 : (day + 1) * this.config.cellWidth;
    }
  }, {
    key: 'getTotalHeight',
    value: function getTotalHeight(len) {
      return len * this.config.cellHeight;
    }
  }, {
    key: 'setHours',
    value: function setHours() {
      this.config.startDate.setHours(0, 0, 0, 0);
      this.config.endDate.setHours(0, 0, 0, 0);
    }
  }, {
    key: 'firstDayMonth',
    value: function firstDayMonth(year, month) {
      return new Date(year, month - 1, 1);
    }
  }, {
    key: 'lastDayMonth',
    value: function lastDayMonth(year, month) {
      return new Date(year, month, 0);
    }
  }, {
    key: 'daysInMonth',
    value: function daysInMonth(month, year) {
      return new Date(year, month, 0).getDate();
    }
  }, {
    key: 'isEqual',
    value: function isEqual(a, b) {
      return a.getTime() === b.getTime();
    }
  }, {
    key: 'dateDiffInDays',
    value: function dateDiffInDays(a, b) {
      var MS_PER_DAY = 1000 * 60 * 60 * 24;
      var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
      var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
      return Math.floor((utc2 - utc1) / MS_PER_DAY);
    }
  }, {
    key: 'getFormattedDate',
    value: function getFormattedDate(date) {
      var currDate = date.getDate();
      var currMonth = date.getMonth() + 1;
      var currYear = date.getFullYear();
      return currYear + '-' + currMonth + '-' + currDate;
    }
  }, {
    key: 'tooltipView',
    value: function tooltipView(data) {
      var template = '' + '<div class="gantt-tooltip">' + '    <div class="tooltip-content">' + '        <img src="{0}" alt="tooltip-img">' + '        <span class="title">{1}</span>' + '        <div class="desc">' + '            {2} <br> {3} <br> {4}' + '        </div>' + '    </div>' + '    <div class="tooltip-action">' + '        <span>Gidiş: <span class="desc">{5}</span></span><br>' + '        <span>Dönüş: <span class="desc">{6}</span></span>' + '        <div class="price">' + '            <div class="tl">{7}</div>' + '            <div class="eur">{8}</div>' + '        </div>' + '    </div>' + '</div>';

      var html = this.format(template, data.image, data.title, data.desc[0], data.desc[1], data.desc[2], data.dates.begin, data.dates.end, this.format('{0} {1}', data.price.converted.price, data.price.converted.priceType), this.format('{0} {1}', data.price.original.price, data.price.original.priceType));
      return html;
    }
  }, {
    key: 'tooltipHover',
    value: function tooltipHover() {
      var el = $$1(this.element);
      var options = this.config;

      // tooltip mouse enter & leave
      $$1('.gantt-event-block', el).on('mouseenter', function () {
        var elheight = $$1(el).height();
        // const elwidth = $(el).width();
        var eltop = $$1(el).offset().top;

        var data = $$1(this).data('tooltip');
        var left = $$1(this).offset().left;
        var top = $$1(this).offset().top;

        if (top >= elheight + eltop - 168) {
          // position top
          data = $$1(data).css({ left: left });
          $$1('body').append(data);
          var dheight = $$1('.gantt-tooltip', 'body').outerHeight();
          $$1('.gantt-tooltip', 'body').css('top', top - dheight - 12);
        } else {
          // position bottom
          data = $$1(data).css({
            top: top + options.cellHeight,
            left: left
          });
          $$1('body').append(data);
        }

        $$1('.gantt-tooltip', 'body').hide().fadeIn(250);
      }).on('mouseleave', function () {
        $$1('.gantt-tooltip', 'body').remove();
      });
    }
  }, {
    key: 'colHighlighter',
    value: function colHighlighter() {
      var el = $$1(this.element);
      // highlighter
      $$1('.gantt-grid-col, .gantt-header-day, .gantt-header-day-min', el).on('mouseenter', function () {
        // const grIndex = $(this).closest('.gantt-grid-col').index();
        var gcIndex = $$1(this).index();

        $$1('.gantt-container', el).find('.gantt-grid-col').removeClass('active').eq(gcIndex).addClass('active');
        $$1('.gantt-header', el).find('.gantt-header-days').find('.gantt-header-day').removeClass('active').eq(gcIndex).addClass('active');
        $$1('.gantt-container', el).find('.gantt-header').find('.gantt-header-days-min').find('.gantt-header-day-min').removeClass('active').eq(gcIndex).addClass('active');
      });
      // event hover
      $$1('.gantt-event-block', el).on('mousemove', function () {
        $$1('.gantt-container', el).find('.gantt-grid-col').removeClass('active');
        $$1('.gantt-header', el).find('.gantt-header-days').find('.gantt-header-day').removeClass('active');
        $$1('.gantt-container', el).find('.gantt-header').find('.gantt-header-days-min').find('.gantt-header-day-min').removeClass('active');
      });
    }
  }, {
    key: 'format',
    value: function format() {
      // eslint-disable-next-line prefer-rest-params
      var theString = arguments[0];
      for (var i = 1; i < arguments.length; i += 1) {
        var regEx = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
        // eslint-disable-next-line prefer-rest-params
        theString = theString.replace(regEx, arguments[i]);
      }
      return theString;
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      $$1(window).off('scroll');
      this.element.empty();
      this.element.removeData('plugin_Gantt');
      this.hook('onDestroy');
    }
  }], [{
    key: 'setDefaults',
    value: function setDefaults(options) {
      $$1.extend(DEFAULTS, options);
    }
  }]);
  return Gantt;
}();

Gantt.LANGUAGES = {
  en: {
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  }
};

$$1.extend(Gantt.prototype, lazyload);

var other = $$1.fn.gantt;

$$1.fn.gantt = function (options) {
  return this.each(function () {
    if (!$$1.data(this, 'plugin_Gantt')) {
      $$1.data(this, 'plugin_Gantt', new Gantt($$1(this), options));
    }
  });
};

$$1.fn.gantt.version = '1.0.0';
$$1.fn.gantt.l10n = Gantt.LANGUAGES;
$$1.fn.gantt.setDefaults = Gantt.setDefaults;

// No conflict
$$1.fn.gantt.noConflict = function () {
  $$1.fn.gantt = other;
  return this;
};

})));
//# sourceMappingURL=jquery-gantt.js.map
