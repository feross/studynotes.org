var cluster = require('cluster')


/**
 * Log a message
 *
 * @arguments Stuff to log
 */
global.log = function (){
  var args = Array.prototype.slice.call(arguments, 0)
  if (cluster.isWorker) {
    args.unshift('[' + cluster.worker.id + ']')
  }
  console.log.apply(console.log, args)
}

/**
 * Log an error
 * 
 * @arguments Stuff to log
 */
global.error = function(){
  var args = Array.prototype.slice.call(arguments, 0)
  if (cluster.isWorker) {
    args.unshift('[' + cluster.worker.id + ']')
  }
  args.unshift('ERROR:')
  console.error.apply(console.error, args)
}

// Dump all the underscore.string methods into util
// (If there's a conflict, the functions defined later will override)
module.exports = require('underscore.string')

u.extend(module.exports,
  /**
   * Convert string to URL slug
   * 
   * @param  {String} v String to convert
   * @return {String}   URL slug
   */
  { slugify: function (v){
    var str = (v || '')
      .toLowerCase()
      .replace(/[^-a-z0-9 ]/g, '')
      .replace(/\s+/g, '-')

    return util.trim(str, '-')
  }

  /**
   * Convert arguments into a dash-separated String for use in page titles
   *
   * @arguments {String} Page title components
   * @return Dash-separated String
   */
  , titleify: function (/* ... */){
      var args = Array.prototype.slice.call(arguments, 0)
      return args.join(' - ')
    }

  /**
   * Add commas to an integer, so that it's easier to read.
   * @param {Integer} x The number
   */
  , addCommasToInteger: function (x){
      x += ''
      var rgx = /(\d+)(\d{3})/
      
      while (rgx.test(x)) {
        x = x.replace(rgx, '$1' + ',' + '$2')
      }
      return x
    }

  /**
   * Function that does nothing.
   */
  , noop: function() {}

})



