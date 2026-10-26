#!/usr/bin/env node

/**
 * Fetches all user instances and calls user.save() on them.
 * This is handy for running the pre-save method on all users
 * when adding new generated fields to the schema.
 */

const model = require('../model')

model.connect(async function (err) {
  if (err) throw err
  const items = await model.Note.find()
  console.log(items.length)

  for (const item of items) {
    console.log('id', item._id)
    await item.save()
  }
  console.log('\nDONE')
})
