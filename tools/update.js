#!/usr/bin/env node

/**
 * Fetches all user instances and calls user.save() on them.
 * This is handy for running the pre-save method on all users
 * when adding new generated fields to the schema.
 */

var model = require('../model')
var runParallelLimit = require('run-parallel-limit')

model.connect(function (err) {
  if (err) throw err
  model.Note
    .find()
    .exec(function (err, items) {
      if (err) throw err
      console.log(items.length)

      runParallelLimit(items.map(function (item) {
        return function (cb) {
          console.log('id', item._id)
          item.save(cb)
        }
      }), 1, function (err) {
        if (err) {
          console.log(err)
          throw err
        }
        console.log('\nDONE')
      })
    })
})
