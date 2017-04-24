describe("jquery-gantt", function () {

  beforeEach(function () {
    $('#demo').gantt({
      data: [],
      startDate: new Date('2011-01-21'),
      endDate: new Date('2012-01-01')
    });
  });

  it("date isEqual", function () {
    var instance = $('#demo').gantt().data('plugin_Gantt');
    var a = new Date('2017-11-10');
    var b = new Date('2017-11-10');
    var isEqual = instance.isEqual(a, b);
    expect(isEqual).toEqual(true);
  });

  it("date dateDiffInDays", function () {
    var instance = $('#demo').gantt().data('plugin_Gantt');
    var a = new Date('2016-11-10');
    var b = new Date('2017-11-10');
    var dateDiffInDays = instance.dateDiffInDays(a, b);
    expect(dateDiffInDays).toEqual(365);
  });

  it("date daysInMonth", function () {
    var instance = $('#demo').gantt().data('plugin_Gantt');
    var dateDiffInDays = instance.daysInMonth(2, 2017);
    expect(dateDiffInDays).toEqual(28);
  });

  it("firstDayMonth", function () {
    var instance = $('#demo').gantt().data('plugin_Gantt');
    var firstDayMonth = instance.firstDayMonth(2017, 1);
    expect(firstDayMonth.getDate()).toEqual(1);
  });

  it("lastDayMonth", function () {
    var instance = $('#demo').gantt().data('plugin_Gantt');
    var lastDayMonth = instance.lastDayMonth(2017, 2);
    expect(lastDayMonth.getDate()).toEqual(28);
  });

  it("getTotalWidth", function () {
    var instance = $('#demo').gantt().data('plugin_Gantt');
    var a = new Date('2016-11-10');
    var b = new Date('2017-11-10');
    instance.config.cellWidth = 22;
    var dateDiffInDays = instance.dateDiffInDays(a, b);
    var getTotalWidth = instance.getTotalWidth(dateDiffInDays);
    expect(getTotalWidth).toEqual(8052);
  });

});
