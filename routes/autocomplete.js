var auto = require('run-auto')
var model = require('../model')
var util = require('../util')
var values = require('object-values')

var MAX_RESULTS = 8
var MAX_QUERY_LENGTH = 255 // prevent mongoDB exceptions

module.exports = function (app) {
  app.get('/autocomplete', function (req, res, next) {
    var q = req.query.q

    autocomplete(q, function (err, results) {
      if (err) return next(err)
      res.send({
        q: q,
        results: results
      })
    })
  })
}

function autocomplete (query, cb) {
  query || (query = '')
  query = query.trim()

  if (query.length >= MAX_QUERY_LENGTH) return cb(null, [])

  auto({
    courses: function (cb) {
      model.Course
        .find({ $or: [
          { name: regexForQuery(query) },
          { searchName: regexForQuery(query) }
        ]})
        .sort('-hits')
        .limit(MAX_RESULTS)
        .select('name hits')
        .exec(cb)
    },

    notes: function (cb) {
      model.Note
        .find({ name: regexForQuery(query) })
        .sort('-hits')
        .limit(MAX_RESULTS)
        .select('name hits course notetype')
        .exec(cb)
    },

    users: function (cb) {
      model.User
        .find({ name: regexForQuery(query) })
        .sort('-hits')
        .limit(MAX_RESULTS)
        .select('name hits')
        .exec(cb)
    },

    colleges: function (cb) {
      model.College
        .find({ $or: [
          { name: regexForQuery(query) },
          { shortName: regexForQuery(query) }
        ]})
        .sort('-hits')
        .limit(MAX_RESULTS)
        .select('name hits')
        .exec(cb)
    },

    essays: function (cb) {
      model.Essay
        .find({ name: regexForQuery(query) })
        .sort('-hits')
        .limit(MAX_RESULTS)
        .select('name hits college')
        .exec(cb)
    }

  }, function (err, r) {
    if (err) return cb(err)

    // Merge result objects into one results array
    var results = [].concat.apply([], values(r)).map(function (result) {
      return {
        model: result,
        weight: weight(result, query)
      }
    })

    // Sort results by weight
    results.sort(function (a, b) {
      return b.weight - a.weight
    })

    // Return small number of results
    results.splice(MAX_RESULTS)

    // Only return necessary information
    results = results.map(function (result, i) {
      return {
        desc: result.model.searchDesc,
        id: result.model.id,
        name: highlight(result.model.name, query),
        position: i + 1,
        type: result.model.constructor.modelName,
        url: result.model.url,
        weight: result.weight
      }
    })

    cb(null, results)
  })
}

/**
 * Given a search query, returns a regular expression that matches
 * strings with words that start with the words in the query.
 *
 * Example:
 *
 *   regexForQuery('Hist')  // matches 'AP History', 'History'
 *   regexForQuery('Eng Lit')  // matches 'English Literature'
 *
 * @param  {String} query search query
 * @return {RegExp}
 */
function regexForQuery (query) {
  var tokens = query.split(' ')
  var str = '(^|\\s)[^a-z]*' + util.escapeRegExpString(tokens[0])

  for (var i = 1, len = tokens.length; i < len; i++) {
    str += '.*\\s[^a-z]*' + util.escapeRegExpString(tokens[i])
  }

  return new RegExp(str, 'i')
}


/**
 * Calculate the weight of a result, for a given query
 * @param  {Object} result
 * @param  {String} query
 * @return {Number} weight
 */
function weight (result, query) {
  var weight = 0
  var words = query.split(' ')

  // Model-specific weights
  switch (result.constructor.modelName) {
    case 'Course':
      weight += 20
      break
    case 'College':
      weight += 10
      break
    case 'Note':
      weight += 2
      break
    case 'Essay':
      weight += 1
      break
    case 'User':
      weight += 0
      break
  }

  // Exact match
  if (result.name.toLowerCase() === query.toLowerCase()) {
    weight += 1000
  }

  // Word match
  words.forEach(function (word) {
    if (word.length <= 3) return
    var re = new RegExp('(^|\\s)' + util.escapeRegExpString(word) + '($|\\s)', 'i')
    if (re.test(result.name)) {
      weight += 100
    }
  })

  return weight
}

/**
 * Highlights occurances of the words in `query` in a given string `str` by
 * surrounding occurrances with a <strong> tag.
 *
 * @param  {String} str   String to search over
 * @param  {String} query Query string
 * @return {String} HTML string containing highlights
 */

function highlight (str, query) {
  var tokens = query.split(' ')
  var reStr = ''

  tokens.forEach(function (token, i) {
    if (i !== 0) {
      reStr += '|'
    }
    reStr += '((^|\\s)[^a-z]*' + util.escapeRegExpString(tokens[i]) + ')'
  })

  str = str.replace(new RegExp(reStr, 'gi'), '<strong>$&</strong>')

  return str
}
