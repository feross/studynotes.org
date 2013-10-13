/*jslint node: true */
"use strict";

exports.byProp = function (propName, desc) {
  return function (a, b) {
    if (a[propName] < b[propName]) return desc ?  1 : -1
    if (a[propName] > b[propName]) return desc ? -1 :  1
    return 0
  }
}
