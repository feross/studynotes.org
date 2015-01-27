var config = require('../config')
var mongoose = require('mongoose')
var slugify = require('underscore.string/slugify')

/**
 * Mongoose plugins
 */

exports.modifyDate = function (schema, opts) {
  schema.add({ modifyDate: Date })

  schema.pre('save', function (next) {
    this.modifyDate = new Date()
    next()
  })

  if (opts && opts.index) {
    schema.path('modifyDate').index(opts.index)
  }
}

exports.createDate = function (schema, opts) {
  schema.add({ createDate: Date })

  schema.pre('save', function (next) {
    if (!this.createDate) this.createDate = new Date()
    next()
  })

  if (opts && opts.index) {
    schema.path('createDate').index(opts.index)
  }
}

exports.hits = function (schema) {
  schema.add({ hits: { type: Number, default: 0, index: true } })

  schema.pre('save', function (next) {
    if (!this.hits) this.hits = 0
    next()
  })

  // Update hit count, asyncronously
  schema.methods.hit = function (cb) {
    cb || (cb = function () {})
    this.update({ $inc: { hits: 1 } }, { upsert: true }, cb)
  }
}

exports.absoluteUrl = function (schema) {
  if (schema.virtualpath('url')) {
    schema.virtual('absoluteUrl').get(function () {
      return config.siteOrigin + this.url
    })
  } else {
    throw new Error('Missing url path, so cannot use plugin.absolutePath')
  }
}

/**
 * Automatic slug generation.
 *
 * Pre-save hook to check for existence of an _id. When no _id is set at save
 * time, we automatically generate one which acts as the slug.
 */
exports.slug = function (schema, opts) {
  schema.pre('save', function (next) {
    var self = this
    if (self._id) return next()

    var initialSlug = slugify(self.name)

    // Remove words from the end of the slug until the length is okay
    while (initialSlug.length > config.maxSlugLength) {
      initialSlug = initialSlug.replace(/-([^-]*)$/, '')
    }

    var num = 0 // number to append to slug to try to make it unique
    checkSlug(initialSlug)

    function checkSlug (potentialSlug) {
      mongoose.model(opts.model)
        .count({ _id: potentialSlug })
        .exec(function (err, count) {
          if (err) return next(err)

          if (count === 0) {
            self._id = potentialSlug
            next()
          } else {
            // If slug is taken, try appending a number to end
            num += 1
            checkSlug(initialSlug + '-' + num)
          }
        })
    }
  })
}
