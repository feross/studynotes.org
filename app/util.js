exports.slugify = function (v) {
  var str = (v || '')
    .toLowerCase()
    .replace(/[^-a-z0-9 ]/g, '')
    .replace(/\s+/g, '-');
  return _.str.trim(str, '-');
}