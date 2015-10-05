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
  model.Essay
    .find()
    .exec(function (err, users) {
      if (err) throw err
      console.log(users.length)

      runParallelLimit(users.map(function (user) {
        return function (cb) {
          console.log('id', user._id)
          user.save(cb)
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

