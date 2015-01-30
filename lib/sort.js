var reChapter = /[^0-9]*([0-9]+)[^0-9]*/

exports.byProp = function (propName, sortDesc) {
  return function (a, b) {
    if (a[propName] < b[propName]) return sortDesc ? 1 : -1
    if (a[propName] > b[propName]) return sortDesc ? -1 : 1
    return 0
  }
}

/**
 * Sensical sort for chapter numbers
 */
exports.sortChapters = function (a, b) {
  var aResult = reChapter.exec(a.name)
  var bResult = reChapter.exec(b.name)
  a = Number(aResult && aResult[1])
  b = Number(bResult && bResult[1])
  if (a < b) return -1
  if (a > b) return 1
  return 0
}
