module.exports = {

  slugify: (v) ->
    str = (v || '')
      .toLowerCase()
      .replace(/[^-a-z0-9 ]/g, '')
      .replace(/\s+/g, '-')
    return u.str.trim(str, '-')

  titleify: () ->
    args = Array.prototype.slice.call(arguments, 0)
    return args.join(' - ')

  addCommasToInteger: (x) ->
    x += ''
    rgx = /(\d+)(\d{3})/
    while rgx.test(x)
      x = x.replace(rgx, '$1' + ',' + '$2')
    x
}