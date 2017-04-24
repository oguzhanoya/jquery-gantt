import $ from 'jquery';

export default {
  buildData() {
    const url = this.config.dataURL;
    return $.ajax({
      url,
      dataType: 'jsonp',
      jsonp: 'callback',
      crossDomain: true,
      contentType: 'application/json',
    });
  },

  initLazyLoad() {
    const startDate = this.config.startDate;
    const endDate = this.config.endDate;
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    this.scrollHandler();
  },

  renderLazyLoad(data, startDate, endDate) {
    this.renderLazyLoadGrid(data, startDate, endDate);
    const el = $(this.element);
    const templateHeaderMonths = $('.gantt-header-months', el);
    const templateHeaderDays = $('.gantt-header-days', el);
    const templateHeaderDaysMin = $('.gantt-header-days-min', el);

    // difference between start-date and end-date
    const num = this.dateDiffInDays(startDate, endDate);
    this.renderLazyLoadEvents(data, num);

    for (let i = 0; i <= num; i += 1) {
      const templateHeaderMonth = $('<div>', { class: 'gantt-header-month' });
      const templateHeaderDay = $('<div>', { class: 'gantt-header-day' });
      const templateHeaderDayMin = $('<div>', { class: 'gantt-header-day-min' });

      // const weekOfday = startDate.getDay();
      const day = startDate.getDate();
      const month = startDate.getMonth() + 1;
      const year = startDate.getFullYear();
      let monthWidth = this.daysInMonth(month, year) * this.config.cellWidth;
      // const weekOfdayName = this.config.region.dayNamesMin[weekOfday];
      const monthName = this.config.region.monthNames[month - 1];

      const dayTemplate = $(templateHeaderDay).text(day).css('width', this.config.cellWidth);
      // const dayMinTemplate = $(templateHeaderDayMin).text(weekOfdayName)
      //  .css({ width: this.config.cellWidth });
      const monthTemplate = $(templateHeaderMonth).text(`${monthName} ${year}`).css({ width: monthWidth });

      templateHeaderDays.append(dayTemplate);
      templateHeaderDaysMin.append(templateHeaderDayMin);

      const firstMonthIsNotFull = i === 0;

      const firstDay = this.firstDayMonth(year, month);
      firstDay.setHours(0, 0, 0, 0);
      const firstDayEndDateMonth = this.firstDayMonth(
        this.config.endDate.getFullYear(),
        this.config.endDate.getMonth() + 1);
      firstDayEndDateMonth.setHours(0, 0, 0, 0);

      const checkFirstDayMonth = this.isEqual(startDate, firstDay);
      const checkFirstDayMonthEndDate = this.isEqual(startDate, firstDayEndDateMonth);

      if (checkFirstDayMonth || firstMonthIsNotFull) {
        if (firstMonthIsNotFull) {
          monthWidth -= ((day - 1) * this.config.cellWidth);
        }

        if (checkFirstDayMonthEndDate) {
          monthWidth = (this.config.endDate.getDate() * this.config.cellWidth);
        }

        // var monthName = this.config.region.monthNames[month - 1];
        // var monthTemplate = $(templateHeaderMonth).text(`${monthName} ${year}`)
        //  .css({ width: monthWidth });

        templateHeaderMonths.append(monthTemplate);
      }

      startDate.setDate(startDate.getDate() + 1);
    }

    const totalWidth = $('.gantt-header-day', el).length * this.config.cellWidth;
    $(templateHeaderMonths, el).css({ width: totalWidth });
    $(templateHeaderDays, el).css({ width: totalWidth });
    $(templateHeaderDaysMin, el).css({ width: totalWidth });

    const templateGrid = $('.gantt-grid', el);
    $(templateGrid, el).css({ width: totalWidth });

    const templateGridRow = $('.gantt-grid-row', el);
    $(templateGridRow, el).css({ width: this.gridDefaults.gridtotalWidth });

    const templateGridCol = $('.gantt-grid-col', el);
    $(templateGridCol, el).css({ height: this.gridDefaults.gridtotalHeight });

    $('.gantt-event-row', el).css({ width: this.gridDefaults.gridtotalWidth });

    this.gridDefaults.eventsWidth = this.gridDefaults.gridtotalWidth;
  },

  renderLazyLoadGrid(data, startDate, endDate) {
    const el = $(this.element);
    // difference between start-date and end-date
    const num = this.dateDiffInDays(startDate, endDate);
    const totalWidth = this.getTotalWidth(num);
    const totalHeight = this.getTotalHeight(data.length);
    const templateGrid = $('.gantt-grid', el);
    const templateGridCols = $('.gantt-grid-cols', el);
    const templateGridRows = $('.gantt-grid-rows', el);

    const sDate = new Date(startDate.getTime());
    for (let i = 0; i <= num; i += 1) {
      const templateGridCol = $('<div>', { class: 'gantt-grid-col', width: this.config.cellWidth, height: totalHeight });

      // firefox width problem fix
      templateGridCol.css('width', this.config.cellWidth);

      const month = sDate.getMonth() + 1;
      const year = sDate.getFullYear();

      const lastDay = this.lastDayMonth(year, month);

      if (this.isEqual(sDate, lastDay)) {
        templateGridCol.css('border-color', '#bec5cc');
      }

      templateGridCols.append(templateGridCol);
      // eslint-disable-line no-redeclare
      sDate.setDate(sDate.getDate() + 1);
    }

    data.forEach(function () {
      const templateGridRow = $('<div>', { class: 'gantt-grid-row', width: totalWidth, height: this.config.cellHeight });
      templateGridRows.append(templateGridRow);
    }, this);

    templateGrid.append(templateGridCols).append(templateGridRows);

    this.gridDefaults.gridtotalWidth += totalWidth;
    this.gridDefaults.gridtotalHeight += totalHeight;
  },

  renderLazyLoadContainer() {
    const template = $('<div>', { class: 'gantt-container' });
    const templateWrapper = $('<div>', { class: 'gantt-wrapper' });

    const templateHeader = $('<div>', { class: 'gantt-header' });
    const templateHeaderMonths = $('<div>', { class: 'gantt-header-months' });
    const templateHeaderDays = $('<div>', { class: 'gantt-header-days' });
    const templateHeaderDaysMin = $('<div>', { class: 'gantt-header-days-min' });

    const arrowLeft = '<div class="arrow arrow-left"><span class="arrow-icon"></span></div>';
    const arrowRight = '<div class="arrow arrow-right"><span class="arrow-icon"></span></div>';

    const templateGrid = $('<div>', { class: 'gantt-grid' });
    const templateEvents = $('<div>', { class: 'gantt-events' });

    const templateLoading = $('<div>', { class: 'gantt-loading', style: 'display: none' });

    templateHeader.append($(templateHeaderMonths));
    templateHeader.append($(templateHeaderDays));
    templateHeader.append($(templateHeaderDaysMin));

    const templateGridCols = $('<div>', { class: 'gantt-grid-cols' });
    const templateGridRows = $('<div>', { class: 'gantt-grid-rows' });

    templateGrid.append(templateGridCols).append(templateGridRows);

    template.append(templateHeader).append(templateGrid).append(templateEvents);
    templateWrapper.append(arrowLeft).append(template).append(arrowRight).append(templateLoading);
    return templateWrapper;
  },

  renderLazyLoadEvents(data) {
    const el = $(this.element);
    const templateEvents = $('.gantt-events', el);

    data.forEach(function (element) {
      const itemStartDate = new Date(element.startdate);

      const templateEventRow = $('<div>', { class: 'gantt-event-row', width: this.totalWidth });
      const templateEvent = $('<div>', { class: 'gantt-event' });

      const tourWidth = (parseInt(element.minNight, 10) + 1) * this.config.cellWidth;
      const remDay = this.dateDiffInDays(this.config.startDate, itemStartDate);

      const tooltipData = $.extend(element.tooltipData, { price: element.price });

      let tourType = '';
      if (element.type === 'Tur') {
        tourType = 'tourFly';
      } else if (element.type === 'TurBus') {
        tourType = 'tourBus';
      } else {
        tourType = 'cruise';
      }

      const title = `${element.minNight} Gece`;

      const eventBlock = $('<a>', {
        class: this.format('gantt-event-block {0}', tourType),
        width: `${tourWidth}px`,
        href: `/${element.url}`,
        target: '_blank',
      }).text(title).css('line-height', `${this.config.cellHeight - 28}px`).data('tooltip', this.tooltipView(tooltipData));

      const eventIcon = $(`<div class="gantt-event-icon"><div class="${tourType}"></div></div>`);

      const eventPrice = $('<div>', {
        class: 'gantt-event-price',
      }).text(`${element.price.original.price} ${element.price.original.priceType}`);

      const eventDesc = $('<div>', {
        class: 'gantt-event-desc',
      }).text(element.title);

      const left = (remDay * this.config.cellWidth) + this.gridDefaults.eventsWidth;

      templateEventRow.append(templateEvent.css('left', left)
        .append(eventBlock)
        .append(eventIcon)
        .append(eventPrice)
        .append(eventDesc))
        .css('height', this.config.cellHeight);

      templateEvents.append(templateEventRow);
    }, this);

    return templateEvents;
  },
};
