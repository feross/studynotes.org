var async = require('async')
  , _ = require('underscore')
  , util = require('./util')
  , escapeRegExp = util.escapeRegExp

exports.autocomplete = function (query, cb) {
  var results = []

  query = query.trim()

  async.parallel([
    function(cb) {
      m.Course
      .find({name: exports.regexForQuery(q)})
      .limit(50)
      .select('name')
      .exec(function(err, courses){
        if (err) { cb(err); return }
        courses.forEach(function(course) {
          results.push({
            weight: exports.weight(course, query),
            result: course
          })
        })
        cb(null)
      })
    },

    function(cb) {
      m.Note
      .find({name: exports.regexForQuery(q)})
      .limit(50)
      .select('name')
      .exec(function(err, notes) {
        if (err) { cb(err); return }
        notes.forEach(function (note) {
          results.push({
            weight: exports.weight(note, query),
            result: note
          })
        })
        cb(null)
      })
    }

  ], function(err){

    // Sort results by weight
    results = _.sortBy(results, function (result) {
      return -result.weight
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
    , str = '(^' + escapeRegExp(tokens[0]) + '|\\s' + escapeRegExp(tokens[0]) + ')'

  for(var i = 1, len = tokens.length; i < len; i++) {
    str += '.*' + tokens[i]
  }

  return new RegExp(str, 'i')
}

var EXACT_MATCH = 10000
  , WORD_MATCH = 1000
  , COURSE = 10
  , NOTE = 0

exports.weight = function (result, query) {
  var weight = 0
    , words = query.split(' ')

  // Model-specific weights
  switch (result.constructor.modelName) {
    case 'Course':
      weight += COURSE
      break
    case 'Note':
      weight += NOTE
      break
  }

  // Exact match
  if (result.name.toLowerCase() == query.toLowerCase()) {
    weight += EXACT_MATCH
  }

  // Word match
  words.forEach(function (word) {
    var re = new RegExp('(^|\\s)' + escapeRegExp(word) + '($|\\s)', 'i')
    if (re.test(result.name)) {
      weight += WORD_MATCH
    }
  })

  return weight
}


