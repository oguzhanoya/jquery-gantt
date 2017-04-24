export default {
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
  onDestroy: $.noop,
};
