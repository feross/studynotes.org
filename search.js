var _ = require('underscore')
var async = require('async')
var model = require('./model')
var util = require('./util')

// Weights
var EXACT_MATCH = 1000
var WORD_MATCH = 100

var MAX_RESULTS = 8

exports.autocomplete = function (query, cb) {
  query = query.trim()

  async.auto({
    courses: function (cb) {
      model.Course
        .find({ name: exports.regexForQuery(query) })
        .sort('-hits')
        .limit(MAX_RESULTS)
        .select('name slug hits')
        .exec(cb)
    },

    notetypes: function (cb) {
      model.Notetype
        .find({ name: exports.regexForQuery(query) })
        .sort('-hits')
        .limit(MAX_RESULTS)
        .select('name slug hits courseId')
        .exec(cb)
    },

    notes: function (cb) {
      model.Note
        .find({ name: exports.regexForQuery(query) })
        .sort('-hits')
        .limit(MAX_RESULTS)
        .select('name slug hits courseId notetypeId')
        .exec(cb)
    },

    users: function (cb) {
      model.User
        .find({ name: exports.regexForQuery(query) })
        .sort('-hits')
        .limit(MAX_RESULTS)
        .select('name slug hits')
        .exec(cb)
    }

  }, function (err, fetched) {
    if (err) return cb(err)

    var results = []
    _.each(fetched, function (models) {
      _.each(models, function (model) {
        results.push([ model, exports.weight(model, query) ])
      })
    })

    // Sort results by weight
    results = _.sortBy(results, function (result) {
      return -1 * result[1]
    })

    // Return small number of results
    results.splice(MAX_RESULTS)

    // Only return necessary information
    results = _.map(results, function (result, i) {
      return {
        desc: result[0].searchDesc,
        name: exports.highlight(result[0].name, query),
        position: i + 1,
        type: result[0].constructor.modelName,
        url: result[0].url,
        weight: result[1]
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
 * @param  {String} q search query
 * @return {RegExp}
 */
exports.regexForQuery = function (query) {
  var tokens = query.split(' ')
  var str = '(^|\\s)[^a-z]*' + util.escapeRegExp(tokens[0])

  for(var i = 1, len = tokens.length; i < len; i++) {
    str += '.*\\s[^a-z]*' + util.escapeRegExp(tokens[i])
  }

  return new RegExp(str, 'i')
}


/**
 * Calculate the weight of a result, for a given query
 * @param  {Object} result
 * @param  {String} query
 * @return {Number} weight
 */
exports.weight = function (result, query){
  var weight = 0
  var words = query.split(' ')

  // Model-specific weights
  switch (result.constructor.modelName) {
    case 'Course':
      weight += 10
      break
    case 'NoteType':
      weight += 2
      break
    case 'Note':
      weight += 1
      break
    case 'User':
      weight += 0
      break
  }

  // Exact match
  if (result.name.toLowerCase() === query.toLowerCase()) {
    weight += EXACT_MATCH
  }

  // Word match
  words.forEach(function (word){
    var re = new RegExp('(^|\\s)' + util.escapeRegExp(word) + '($|\\s)', 'i')
    if (re.test(result.name)) {
      weight += WORD_MATCH
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

exports.highlight = function (str, query) {
  var tokens = query.split(' ')
  var reStr = ''

  tokens.forEach(function (token, i){
    if (i != 0) {
      reStr += '|'
    }
    reStr += '((^|\\s)[^a-z]*' + util.escapeRegExp(tokens[i]) + ')'
  })

  str = str.replace(new RegExp(reStr, 'gi'), '<strong>$&</strong>')

  return str
}