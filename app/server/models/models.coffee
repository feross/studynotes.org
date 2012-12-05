module.exports = (callback) ->

  mongoose = require('mongoose')
  Schema = mongoose.Schema
  plugin = require('./plugin')

  # 
  # Fields that are re-used many times.
  # 
  SLUG = {
    type: String
    match: /[-a-z0-9]+/i
    lowercase: true
  }
  SLUG_UNIQUE = u.extend({}, SLUG, { unique: true })

  #
  # Model schemas
  #
  schemas = {
    
    Course: {
      name: { type: String, required: true, unique: true }
      desc: String
      notetypes: [{ type: Schema.Types.ObjectId, ref: 'Notetype'}]
      slug: SLUG_UNIQUE
      image: String
      setup: () ->
        this.virtual('url').get(() ->
          "/#{this.slug}/"
        )
    }

    Notetype: {
      name: { type: String, required: true, unique: true }
      desc: String
      ordering: Number
      slug: SLUG_UNIQUE
      setup: () ->

    }

    Note: {
      name: { type: String, required: true }
      body: { type: String, required: true }
      courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true }
      notetypeId: { type: Schema.Types.ObjectId, ref: 'Notetype', required: true }
      ordering: Number
      slug: SLUG
      setup: () ->
        # No duplicate names or slugs for a course+notetype.
        this.index({ courseId: 1, notetypeId: 1, slug: 1 }, { unique: true })
        this.index({ courseId: 1, notetypeId: 1, name: 1 }, { unique: true })

        this.index({ courseId: 1, notetypeId: 1})

        this.virtual('url').get(() ->
          course = u.find(m.cache.courses, (c) =>
            u.isEqual(c._id, this.courseId)
          )
          notetype = u.find(m.cache.notetypes, (n) =>
            u.isEqual(n._id, this.notetypeId)
          )
          return "/#{course.slug}/#{notetype.slug}/#{this.slug}/"
        )
    }

  }

  # 
  # Setup up schemas and models.
  # 
  models = {}
  u.each(schemas, (fields, name) ->
    
    # 
    # Remove the setup function from the fields object before creating a Schema,
    # but save it to be invoked later.
    # 
    setup = fields.setup
    fields = u.omit(fields, 'setup')

    schema = new Schema(fields)

    # 
    # Automatic slug generation.
    # 
    # If schema has a "slug" field, set up a pre-save hook to check for existence of slug.
    # When no slug is set at save time, we automatically generate one.
    # 
    if (fields['slug'])
      schema.pre('save', (next) ->
        doc = this

        # If no slug is set, automatically generate one
        if (!doc.slug)
          potentialSlug = initialSlug = util.slugify(doc.name)
          num = 0 # number to try appending to slug in order to make it unique
          done = false # TODO: is this a bug??? Dec 3, 2012

          async.whilst(
            () ->
              # Try appending a number to the end of the slug, after the first try
              if (num > 0)
                potentialSlug = initialSlug + '-' + num
              
              num += 1
              return !done
            ,
            (cb) ->
              doc.model(name).count({ slug: potentialSlug }, (err, count) ->
                if (err)
                  cb(err)
                  return
                
                if (count == 0)
                  doc.slug = potentialSlug
                  done = true
                
                cb()
              )
            ,
            (err) ->
              if (err) then error(err)
              next()
          )

        else
          next()
        
      )

    # Add date and hits fields to all schemas
    schema.plugin(plugin.modifyDate)
    schema.plugin(plugin.createDate)
    schema.plugin(plugin.hits)

    # run setup function (usually to set up multi-indices) if one exists
    if (setup)
      setup.call(schema)

    models[name] = db.model(name, schema)
  )

  global.m = models

  # 
  # Cache commonly accessed data
  # 
  global.m.cache = {}
  async.parallel({
    courses: (cb) ->
      m.Course
        .find()
        .populate('notetypes')
        .exec(cb)

    notetypes: (cb) ->
      m.Notetype.find(cb)
    
  },
  (err, results) ->
    if (err) then error(err); callback(err); return

    global.m.cache.courses = {}
    u.each(results.courses, (course) ->
      global.m.cache.courses[course.slug] = course
    )
    global.m.cache.notetypes = {}
    u.each(results.notetypes, (notetype) ->
      global.m.cache.notetypes[notetype.slug] = notetype
    )

    callback(null)
  )


