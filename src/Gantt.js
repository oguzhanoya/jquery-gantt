import $ from 'jquery';
import DEFAULTS from './Defaults';
import lazyload from './func/lazyload';

class Gantt {
  constructor(element, options) {
    const gridDefaults = {
      gridtotalHeight: 0,
      gridtotalWidth: 0,
      eventsWidth: 0,
    };
    const lang = options.language || DEFAULTS.language;
    // eslint-disable-next-line no-param-reassign
    options.lang = Gantt.LANGUAGES[lang];
    // extend defaults with the init options.
    this.config = $.extend({}, DEFAULTS, options);
    // grid defaults
    this.gridDefaults = $.extend({}, gridDefaults);
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

  init() {
    this.hook('onInit');
    let html = '';
    // erasing all the content from the container
    $(this.element).html(html);

    if (this.config.endDate.getTime() > this.config.startDate.getTime()) {
      // lazy load
      if (this.config.lazyLoad) {
        this.initLazyLoad();
        html = this.renderLazyLoadContainer();
      } else if (this.config.data.length <= 0 && this.config.dataURL !== '') {
        this.buildData().then((data) => {
          this.config.data = data.Items;
          html = this.renderContainer();
          $(this.element).html(html);
          this.attachEvents(this.element, this.config);
          this.tooltipHover();
          this.colHighlighter();
        });
      } else {
        html = this.renderContainer();
      }

      if (this.config.data.length > 0 || this.config.lazyLoad) {
        $(this.element).html(html);
        this.attachEvents(this.element, this.config);
        this.tooltipHover();
        this.colHighlighter();
      }
    } else {
      console.warn('jquery-gantt: start-date is not greater than end-date');
    }
  }

  hook(hookName) {
    if (this.config[hookName] !== undefined) {
      this.config[hookName].call(this.el);
    }
  }

  attachEvents(el, options) {
    // sticky header
    if (options.stickyHeader) {
      const stickyH = function () {
        const top = $('.gantt-wrapper', el).offset().top;
        const height = $('.gantt-wrapper', el).height();
        if (top >= $(this).scrollTop() || $(this).scrollTop() >= ((top + height) - 80)) {
          $('.gantt-header', el).css('position', 'static');
          $('.arrow', el).css('position', 'static');
        } else {
          $('.arrow', el).css({
            position: 'relative',
            top: `${$(this).scrollTop() - top}px`,
          });
          $('.gantt-header', el).css({
            position: 'relative',
            top: `${$(this).scrollTop() - top}px`,
            left: `${$(this).scrollLeft}px`,
            'z-index': 1,
          });
        }
      };
      $(window).scroll(stickyH);
    }
    // scroll page horizontally with mouse wheel
    if (options.mouseScroll) {
      $('.gantt-container', el).on('wheel mousewheel', function (e) {
        if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
          this.scrollLeft -= options.mouseScrollpx;
        } else {
          this.scrollLeft += options.mouseScrollpx;
        }
      });
    }
    if (options.lazyLoad) {
      const self = this;
      let loading = false;
      $('.gantt-container', el).scroll(function () {
        if (this.scrollWidth - this.clientWidth - this.scrollLeft < 900 && !loading) {
          loading = true;
          self.scrollHandler(() => {
            loading = false;
          });
        }
      });
    }
    // scroll drag
    $('.gantt-container', el)
      .on('mousedown', function (event) {
        $(this).data('down', true)
          .data('x', event.clientX)
          .data('scrollLeft', this.scrollLeft)
          .addClass('dragging');
        return false;
      })
      .on('mouseup', function () {
        $(this).data('down', false).removeClass('dragging');
      })
      .on('mousemove', function (event) {
        if ($(this).data('down') === true) {
          this.scrollLeft = ($(this).data('scrollLeft') + $(this).data('x')) - event.clientX;
        }

        if (options.autoHide) {
          const sl = this.scrollLeft;
          let daywidth = sl / options.cellWidth;
          daywidth = Math.floor(daywidth);

          const cWidth = daywidth * options.cellWidth;

          const events = $('.gantt-events', el).find('.gantt-event');
          $.each(events, (index, elem) => {
            let eventLeft = $(elem).css('left');
            eventLeft = parseInt(eventLeft, 10);
            if (eventLeft <= cWidth) {
              $(elem).closest('.gantt-event-row').hide();
            } else {
              $(elem).closest('.gantt-event-row').show();
            }
          });

          const currentDay = new Date(options.startDate.getTime());
          currentDay.setDate(currentDay.getDate() + daywidth);
        }
      })
      .on('mouseleave', function () {
        $(this).data('down', false).removeClass('dragging');
      });

    // arrow button click
    $('.arrow', el).on('click', function () {
      const direction = $(this).hasClass('arrow-right');
      const scrollLeft = $('.gantt-container', el).scrollLeft();
      if (direction) {
        $('.gantt-container', el).scrollLeft(scrollLeft + 240);
      } else {
        $('.gantt-container', el).scrollLeft(scrollLeft - 240);
      }
    });
  }

  xhrRequest(startDate, endDate) {
    const self = this;
    const el = $(this.element);
    const url = this.config.dataURL;
    return $.ajax({
      url,
      dataType: 'jsonp',
      jsonp: 'callback',
      contentType: 'application/json',
      crossDomain: true,
      data: {
        startDate: self.getFormattedDate(startDate),
        endDate: self.getFormattedDate(endDate),
      },
      beforeSend() {
        $('.gantt-loading', el).fadeIn();
      },
    });
  }

  scrollHandler(callback) {
    const self = this;
    const el = $(this.element);

    const startDate = this.config.startDate;
    let nextDate = new Date(this.config.startDate.getTime());

    nextDate.setMonth(nextDate.getMonth() + 2);

    const month = nextDate.getMonth() + 1;
    const year = nextDate.getFullYear();
    nextDate = this.lastDayMonth(year, month);

    const monthEndDate = this.config.endDate.getMonth() + 1;
    const yearEndDate = this.config.endDate.getFullYear();
    const dayEndDate = this.config.endDate.getDate();

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
      this.xhrRequest(startDate, nextDate).done((data) => {
        self.renderLazyLoad(data.Items, startDate, nextDate);
        self.tooltipHover();
        self.colHighlighter();
        if (typeof callback === 'function') {
          callback();
        }
      }).always(() => {
        $('.gantt-loading', el).fadeOut();
      });
    }
  }

  renderHeader(num) {
    const templateHeader = $('<div>', { class: 'gantt-header' });
    const templateHeaderMonths = $('<div>', { class: 'gantt-header-months' });
    const templateHeaderDays = $('<div>', { class: 'gantt-header-days' });
    const templateHeaderDaysMin = $('<div>', { class: 'gantt-header-days-min' });

    const totalWidth = this.getTotalWidth(num);

    this.setHours();
    const startDate = new Date(this.config.startDate.getTime());

    for (let i = 0; i <= num; i += 1) {
      const templateHeaderMonth = $('<div>', { class: 'gantt-header-month' });
      const templateHeaderDay = $('<div>', { class: 'gantt-header-day' });
      const templateHeaderDayMin = $('<div>', { class: 'gantt-header-day-min' });

      const weekOfday = startDate.getDay();
      const day = startDate.getDate();
      const month = startDate.getMonth() + 1;
      const year = startDate.getFullYear();
      let monthWidth = this.daysInMonth(month, year) * this.config.cellWidth;

      const dayTemplate = $(templateHeaderDay).text(day).css('width', this.config.cellWidth);
      $(templateHeaderDays).append(dayTemplate);

      const weekOfdayName = this.config.lang.dayNamesMin[weekOfday];
      const dayMinTemplate = $(templateHeaderDayMin).text(weekOfdayName)
        .css({ width: this.config.cellWidth });
      $(templateHeaderDaysMin).append(dayMinTemplate);

      const firstMonthIsNotFull = i === 0;

      const firstDay = this.firstDayMonth(year, month);
      const firstDayEndDateMonth = this.firstDayMonth(
        this.config.endDate.getFullYear(),
        this.config.endDate.getMonth() + 1);

      startDate.setHours(0, 0, 0, 0);
      const checkFirstDayMonth = this.isEqual(startDate, firstDay);
      const checkFirstDayMonthEndDate = this.isEqual(startDate, firstDayEndDateMonth);

      if (checkFirstDayMonth || firstMonthIsNotFull) {
        if (firstMonthIsNotFull) {
          monthWidth -= ((day - 1) * this.config.cellWidth);
        }

        if (checkFirstDayMonthEndDate) {
          monthWidth = (this.config.endDate.getDate() * this.config.cellWidth);
        }

        const monthName = this.config.lang.monthNames[month - 1];
        const monthTemplate = $(templateHeaderMonth).text(`${monthName} ${year}`).css({ width: monthWidth });
        $(templateHeaderMonths).append(monthTemplate);
      }
      startDate.setDate(startDate.getDate() + 1);
    }

    templateHeader.append($(templateHeaderMonths).css('width', totalWidth));
    templateHeader.append($(templateHeaderDays).css('width', totalWidth));
    templateHeader.append($(templateHeaderDaysMin).css('width', totalWidth));
    return templateHeader;
  }

  renderContainer() {
    const template = $('<div>', { class: 'gantt-container' });
    const templateWrapper = $('<div>', { class: 'gantt-wrapper' });

    const arrowLeft = '<div class="arrow arrow-left"><span class="arrow-icon"></span></div>';
    const arrowRight = '<div class="arrow arrow-right"><span class="arrow-icon"></span></div>';

    // difference between start-date and end-date
    const diffInDays = this.dateDiffInDays(this.config.startDate, this.config.endDate);
    const templateHeader = this.renderHeader(diffInDays);
    const templateGrid = this.renderGrid(diffInDays);
    const templateEvents = this.renderEvents(diffInDays);

    template.append(templateHeader).append(templateGrid).append(templateEvents);
    templateWrapper.append(arrowLeft).append(template).append(arrowRight);
    return templateWrapper;
  }

  renderGrid(num) {
    const data = this.config.data;
    const totalWidth = this.getTotalWidth(num);
    const totalHeight = this.getTotalHeight(data.length);

    const templateGrid = $('<div>', { class: 'gantt-grid', width: totalWidth });
    const templateGridCols = $('<div>', { class: 'gantt-grid-cols' });
    const templateGridRows = $('<div>', { class: 'gantt-grid-rows' });

    const startDate = new Date(this.config.startDate.getTime());

    for (let i = 0; i <= num; i += 1) {
      const templateGridCol = $('<div>', { class: 'gantt-grid-col', width: this.config.cellWidth, height: totalHeight });

      // firefox width problem fix
      templateGridCol.css('width', this.config.cellWidth);

      const month = startDate.getMonth() + 1;
      const year = startDate.getFullYear();

      const lastDay = this.lastDayMonth(year, month);

      startDate.setHours(0, 0, 0, 0);
      if (this.isEqual(startDate, lastDay)) {
        templateGridCol.css('border-color', '#bec5cc');
      }

      templateGridCols.append(templateGridCol);
      startDate.setDate(startDate.getDate() + 1);
    }

    data.forEach(function () {
      const templateGridRow = $('<div>', { class: 'gantt-grid-row', width: totalWidth, height: this.config.cellHeight });
      templateGridRows.append(templateGridRow);
    }, this);

    templateGrid.append(templateGridCols).append(templateGridRows);

    return templateGrid;
  }

  renderEvents(num) {
    const data = this.config.data;
    const totalWidth = this.getTotalWidth(num);
    // const totalHeight = this.getTotalHeight(data.length);

    const templateEvents = $('<div>', { class: 'gantt-events', width: totalWidth });

    data.forEach(function (el) {
      const itemStartDate = new Date(el.startdate);

      const templateEventRow = $('<div>', { class: 'gantt-event-row', width: this.totalWidth });
      const templateEvent = $('<div>', { class: 'gantt-event' });

      const tourWidth = (parseInt(el.minNight, 10) + 1) * this.config.cellWidth;
      const remDay = this.dateDiffInDays(this.config.startDate, itemStartDate);

      const tooltipData = $.extend(el.tooltipData, { price: el.price });

      let tourType = '';
      if (el.type === 'Tur') {
        tourType = 'tourFly';
      } else if (el.type === 'TurBus') {
        tourType = 'tourBus';
      } else {
        tourType = 'cruise';
      }

      const title = `${el.minNight} Gece`;

      const eventBlock = $('<a>', {
        class: `gantt-event-block ${tourType}`,
        width: `${tourWidth}px`,
        href: `${el.url}`,
        target: '_blank',
      }).text(title).css('line-height', `${this.config.cellHeight - 28}px`).data('tooltip', this.tooltipView(tooltipData));

      const eventIcon = $(`<div class="gantt-event-icon"><div class="${tourType}"></div></div>`);

      const eventPrice = $('<div>', {
        class: 'gantt-event-price',
      }).text(`${el.price.original.price} ${el.price.original.priceType}`);

      const eventDesc = $('<div>', {
        class: 'gantt-event-desc',
      }).text(el.title);

      const left = ((remDay) * this.config.cellWidth);

      templateEventRow
        .append(templateEvent.css('left', left)
          .append(eventBlock)
          .append(eventIcon)
          .append(eventPrice)
          .append(eventDesc))
        .css('height', this.config.cellHeight);

      templateEvents.append(templateEventRow);
    }, this);

    return templateEvents;
  }

  getTotalWidth(day) {
    return day === 0 ? 0 : (day + 1) * this.config.cellWidth;
  }

  getTotalHeight(len) {
    return len * this.config.cellHeight;
  }

  setHours() {
    this.config.startDate.setHours(0, 0, 0, 0);
    this.config.endDate.setHours(0, 0, 0, 0);
  }

  firstDayMonth(year, month) {
    return new Date(year, month - 1, 1);
  }

  lastDayMonth(year, month) {
    return new Date(year, month, 0);
  }

  daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  isEqual(a, b) {
    return a.getTime() === b.getTime();
  }

  dateDiffInDays(a, b) {
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utc2 - utc1) / MS_PER_DAY);
  }

  getFormattedDate(date) {
    const currDate = date.getDate();
    const currMonth = date.getMonth() + 1;
    const currYear = date.getFullYear();
    return `${currYear}-${currMonth}-${currDate}`;
  }

  tooltipView(data) {
    const template = '' +
      '<div class="gantt-tooltip">' +
      '    <div class="tooltip-content">' +
      '        <img src="{0}" alt="tooltip-img">' +
      '        <span class="title">{1}</span>' +
      '        <div class="desc">' +
      '            {2} <br> {3} <br> {4}' +
      '        </div>' +
      '    </div>' +
      '    <div class="tooltip-action">' +
      '        <span>Gidiş: <span class="desc">{5}</span></span><br>' +
      '        <span>Dönüş: <span class="desc">{6}</span></span>' +
      '        <div class="price">' +
      '            <div class="tl">{7}</div>' +
      '            <div class="eur">{8}</div>' +
      '        </div>' +
      '    </div>' +
      '</div>';

    const html = this.format(template, data.image, data.title, data.desc[0], data.desc[1], data.desc[2], data.dates.begin, data.dates.end, this.format('{0} {1}', data.price.converted.price, data.price.converted.priceType), this.format('{0} {1}', data.price.original.price, data.price.original.priceType));
    return html;
  }

  tooltipHover() {
    const el = $(this.element);
    const options = this.config;

    // tooltip mouse enter & leave
    $('.gantt-event-block', el)
      .on('mouseenter', function () {
        const elheight = $(el).height();
        // const elwidth = $(el).width();
        const eltop = $(el).offset().top;

        let data = $(this).data('tooltip');
        const left = $(this).offset().left;
        const top = $(this).offset().top;

        if (top >= ((elheight + eltop) - 168)) {
          // position top
          data = $(data).css({ left });
          $('body').append(data);
          const dheight = $('.gantt-tooltip', 'body').outerHeight();
          $('.gantt-tooltip', 'body').css('top', top - dheight - 12);
        } else {
          // position bottom
          data = $(data).css({
            top: top + options.cellHeight,
            left,
          });
          $('body').append(data);
        }

        $('.gantt-tooltip', 'body').hide().fadeIn(250);
      })
      .on('mouseleave', () => {
        $('.gantt-tooltip', 'body').remove();
      });
  }

  colHighlighter() {
    const el = $(this.element);
    // highlighter
    $('.gantt-grid-col, .gantt-header-day, .gantt-header-day-min', el).on('mouseenter', function () {
      // const grIndex = $(this).closest('.gantt-grid-col').index();
      const gcIndex = $(this).index();

      $('.gantt-container', el).find('.gantt-grid-col')
        .removeClass('active')
        .eq(gcIndex)
        .addClass('active');
      $('.gantt-header', el).find('.gantt-header-days').find('.gantt-header-day')
        .removeClass('active')
        .eq(gcIndex)
        .addClass('active');
      $('.gantt-container', el).find('.gantt-header').find('.gantt-header-days-min').find('.gantt-header-day-min')
        .removeClass('active')
        .eq(gcIndex)
        .addClass('active');
    });
    // event hover
    $('.gantt-event-block', el).on('mousemove', () => {
      $('.gantt-container', el).find('.gantt-grid-col').removeClass('active');
      $('.gantt-header', el).find('.gantt-header-days').find('.gantt-header-day').removeClass('active');
      $('.gantt-container', el).find('.gantt-header').find('.gantt-header-days-min').find('.gantt-header-day-min')
        .removeClass('active');
    });
  }

  format() {
    // eslint-disable-next-line prefer-rest-params
    let theString = arguments[0];
    for (let i = 1; i < arguments.length; i += 1) {
      const regEx = new RegExp(`\\{${i - 1}\\}`, 'gm');
      // eslint-disable-next-line prefer-rest-params
      theString = theString.replace(regEx, arguments[i]);
    }
    return theString;
  }

  destroy() {
    $(window).off('scroll');
    this.element.empty();
    this.element.removeData('plugin_Gantt');
    this.hook('onDestroy');
  }

  static setDefaults(options) {
    $.extend(DEFAULTS, options);
  }

}

Gantt.LANGUAGES = {
  en: {
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  },
};

$.extend(Gantt.prototype, lazyload);

export default Gantt;
