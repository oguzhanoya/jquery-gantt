## ![jquery-gantt](https://oguzhanoya.github.io/jquery-gantt/img/logo.svg)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> A jquery plugin for creating a gantt chart.

## Features
- Localizationable
- Easy configuration
- Lightweight (5KB gzipped)
- Works in all major browsers including IE11+

## Compatibility
IE11+, Edge, Chrome, Firefox, Opera, Safari

## Installation
Github
```sh
git clone http://github.com/oguzhanoya/jquery-gantt.git
```

## Configuration

|Setting|Default Value|Description|
|---|---|---|
|data|`[]`|Data source|
|dataURL|`''`|Data source url|
|startDate|`new Date()`|Chart start date|
|endDate|`new Date()`|Chart end date|
|cellWidth | `20` | Width of the chart cell|
|cellHeight|`38`|Height of the chart cell|
|stickyHeader|`false`|Stick an header|
|mouseScroll|`false`|Enables slide moving with mouse|
|mouseScrollpx|`120`|Mouse scroll speed|
|lazyLoad|`false`|Lazy load technique|
|autoHide|`false`|Auto hiding of out of date events|

## Localization

The default `l10n` configuration format looks like this:

```javascript
$.fn.gantt.l10n['en'] = {
    monthNames: [ "January","February","March","April","May","June","July","August","September","October","November","December" ],
    monthNamesShort: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],
    dayNames: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
    dayNamesShort: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
    dayNamesMin: [ "Su","Mo","Tu","We","Th","Fr","Sa" ]
};
```

You must provide 12 months and 7 weekdays (with abbreviations). Always specify weekdays in this order with Sunday first.

## Source Configuration

```javascript
[{
    "title": "Example",
    "startdate": "2016-06-10",
    "enddate": "2016-06-12",
    "url": "http://www.example.com/",
    "type": "Cruise",
    "minNight": "2",
    "price": {
        "original": {
            "price": 798,
            "priceType": "€"
        },
        "converted": {
            "price": 878,
            "priceType": "$"
        }
    },
    "tooltipData": {
        "title": "Example Tour",
        "image": "http://example.com/image.jpg",
        "desc": [
            "Lorem ipsum dolor sit amet",
            "consectetur adipisicing elit",
            "Explicabo repellat temporibus "
        ],
        "dates": {
            "begin": "10 June 2016 Friday",
            "end": "12 June 2016 Sunday"
        }
    }
}]
```

## License
MIT
