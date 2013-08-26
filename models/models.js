var _ = require('underscore')
var async = require('async')
var config = require('../config')
var mongoose = require('mongoose')
var Schema = mongoose.Schema

module.exports = function (callback){
  // Mongoose plugins
  var plugin =
    { modifyDate: function (schema, options){
        schema.add({ modifyDate: Date })

        schema.pre('save', function (next){
          this.modifyDate = new Date
          next()
        })

        if (options && options.index)
          schema.path('modifyDate').index(options.index)
      }

    , createDate: function (schema, options){
        schema.add({ createDate: Date })

        schema.pre('save', function (next){
          if (!this.createDate)
            this.createDate = new Date

          next()
        })

        if (options && options.index)
          schema.path('createDate').index(options.index)
      }

    , hits: function (schema, options){
        schema.add({ hits: { type: Number, default: 0 } })

        schema.pre('save', function (next){
          if (!this.hits)
            this.hits = 0

          next()
        })

        if (options && options.index)
          schema.path('hits').index(options.index)
      }

    , absoluteUrl: function (schema, options){
        if (schema.virtualpath('url'))
          schema.virtual('absoluteUrl').get(function (){
            return config.siteOrigin + this.url
          })
      }
  }

  // Fields that are re-used many times
  var SLUG =
    { type: String
    , match: /[-a-z0-9]+/i
    , lowercase: true
    }

  var SLUG_UNIQUE = _.extend({}, SLUG, { unique: true })

  //
  // Model schemas
  //
  var schemas =
    { Course:
      { name: { type: String, required: true, unique: true }
      , desc: String
      , slug: SLUG_UNIQUE
      , image: String
      , examDate: Date

      , setup: function (){
          this.virtual('url').get(function(){
            return '/' + this.slug + '/'
          })

          this.virtual('searchDesc').get(function (){
            return 'Course'
          })

          // TODO: remove this hack
          this.methods.getNotetypes = function (cb){
            this.model('Notetype')
            .find({courseId: this.id})
            .sort('ordering')
            .exec(cb)
          }
        }
      }

    , Notetype:
      { name: { type: String, required: true }
      , singularName: String
      , shortDesc: String
      , desc: String
      , courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true }
      , ordering: Number
      , slug: SLUG

      , setup: function (){
          this.index({ courseId: 1, slug: 1 }, { unique: true })
          this.index({ courseId: 1 })

          this.virtual('url').get(function(){
            var self = this
            course = _.find(m.cache.courses, function (c){
              return c.id == self.courseId.toString()
            })

            return '/' + course.slug + '/' + this.slug + '/'
          })
        }
      }

    , Note:
      { name: { type: String, required: true, index: true }
      , body: { type: String, required: true }
      , courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true }
      , notetypeId:
        { type: Schema.Types.ObjectId
        , ref: 'Notetype'
        , required: true
        }
      , ordering: Number
      , slug: SLUG

      , setup: function (){
          // No duplicate names or slugs for a course+notetype.
          this.index({ courseId: 1, notetypeId: 1, slug: 1 }, { unique: true })
          this.index({ courseId: 1, notetypeId: 1, name: 1 }, { unique: true })

          this.index({ courseId: 1, notetypeId: 1})

          this.virtual('url').get(function (){
            var courseId = this.courseId.toString()
              , notetypeId = this.notetypeId.toString()

            course = _.find(m.cache.courses, function (c){
              return c.id == courseId
            })
            notetype = _.find(course.notetypes, function (n){
              return n.id == notetypeId
            })

            return '/' + course.slug + '/' + notetype.slug + '/' + this.slug + '/'
          })

          this.virtual('searchDesc').get(function (){
            var courseId = this.courseId.toString()
              , notetypeId = this.notetypeId.toString()

            course = _.find(m.cache.courses, function (c){
              return c.id == courseId
            })
            notetype = _.find(course.notetypes, function (n){
              return n.id == notetypeId
            })

            return course.name + ' ' + (notetype.singularName || notetype.name)
          })
        }
      }
    }

  // Setup up schemas and models.
  var models = {}
  _.each(schemas, function (fields, name){

    // Remove the setup function from the fields object before creating a Schema,
    // but save it to be invoked later.
    var setup = fields.setup
      , fields = _.omit(fields, 'setup')

      , schema = new Schema(fields)

    /**
     * Automatic slug generation.
     *
     * If schema has a "slug" field, set up a pre-save hook to check for
     * existence of slug. When no slug is set at save time, we automatically
     * generate one.
     */
    if (fields['slug']) {
      schema.pre('save', function (next){
        var doc = this

        // If no slug is set, automatically generate one
        if (!doc.slug) {
          var num = 0 // number to append to slug to try to make it unique
            , done = false
            , potentialSlug
            , initialSlug

          potentialSlug = initialSlug = util.slugify(doc.name)

          async.whilst(function (){
            // After the first try, append a number to end of slug
            if (num > 0)
              potentialSlug = initialSlug + '-' + num

            num += 1
            return !done
          }
          , function (cb){
              doc
              .model(name)
              .count({ slug: potentialSlug }, function (err, count){
                if (err) {
                  cb(err)
                  return
                }

                if (count == 0) {
                  doc.slug = potentialSlug
                  done = true
                }

                cb()
              })
            }
          , function (err){
            if (err) console.error(err)
            next()
          })

        } else {
          next()
        }
      })
    }

    // run setup function (usually to set up multi-indices) if one exists
    if (setup)
      setup.call(schema)

    // Add date and hits fields to all schemas
    schema.plugin(plugin.modifyDate)
    schema.plugin(plugin.createDate)
    schema.plugin(plugin.hits)
    schema.plugin(plugin.absoluteUrl)

    models[name] = db.model(name, schema)
  })

  global.m = models

  //
  // Cache commonly accessed data
  //
  global.m.cache = {}
  async.parallel(
    { courses: function (cb){
        m.Course.find(cb)
      }
    , notetypes: function (cb){
        m.Notetype.find(cb)
      }
    }
  , function (err, results){
      if (err) {
        console.error(err)
        callback(err)
        return
      }

      global.m.cache.courses = {}

      // TODO: remove this hack
      async.forEachSeries(results.courses, function (course, cb){
        global.m.cache.courses[course.slug] = course

        course.getNotetypes(function (err, notetypes){
          if (err) {
            console.error(err)
            callback(err)
            return
          }
          course.notetypes = notetypes
          cb(null)
        })
      }
      , function (err){
        callback(null)
      })

    }
  )

}
