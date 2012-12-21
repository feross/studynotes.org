mongoose = require('mongoose')
Schema = mongoose.Schema

module.exports = (callback) ->
  #
  # Mongoose plugins
  #
  plugin = {
    modifyDate: (schema, options) ->
      schema.add({ modifyDate: Date })
      
      schema.pre('save', (next) ->
        this.modifyDate = new Date
        next()
      )
      
      if (options && options.index)
        schema.path('modifyDate').index(options.index)


    createDate: (schema, options) ->
      schema.add({ createDate: Date })
      
      schema.pre('save', (next) ->
        if (!this.createDate)
          this.createDate = new Date
        
        next()
      )
      
      if (options && options.index)
        schema.path('createDate').index(options.index)


    hits: (schema, options) ->
      schema.add({ hits: { type: Number, default: 0 } })

      schema.pre('save', (next) ->
        if (!this.hits)
          this.hits = 0

        next()
      )

      if (options && options.index)
        schema.path('hits').index(options.index)

    absoluteUrl: (schema, options) ->
      if (schema.virtualpath('url'))
        schema.virtual('absoluteUrl').get(() ->
          "#{config.siteUrl}#{this.url}"
        )
  }

  # 
  # Fields that are re-used many times
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
      slug: SLUG_UNIQUE
      image: String

      setup: () ->
        this.virtual('url').get(() ->
          "/#{this.slug}/"
        )
        this.methods.getNotetypes = (cb) ->
          this.model('Notetype').find({courseId: this.id}).sort('ordering').exec(cb)

    }

    Notetype: {
      name: { type: String, required: true }
      shortDesc: type: String
      desc: String
      courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true }
      ordering: Number
      slug: SLUG

      setup: () ->
        this.index({ courseId: 1, slug: 1 }, { unique: true })
        this.index({ courseId: 1 })

        this.virtual('url').get(() ->
          course = u.find(m.cache.courses, (c) =>
            c.id == this.courseId.toString()
          )
          return "/#{course.slug}/#{this.slug}/"
        )
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
            c.id == this.courseId.toString()
          )
          notetype = u.find(course.notetypes, (n) =>
            n.id == this.notetypeId.toString()
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

    # run setup function (usually to set up multi-indices) if one exists
    if (setup)
      setup.call(schema)

    # Add date and hits fields to all schemas
    schema.plugin(plugin.modifyDate)
    schema.plugin(plugin.createDate)
    schema.plugin(plugin.hits)
    schema.plugin(plugin.absoluteUrl)

    models[name] = db.model(name, schema)
  )

  global.m = models

  # 
  # Cache commonly accessed data
  # 
  global.m.cache = {}
  async.parallel({
    courses: (cb) ->
      m.Course.find(cb)

    notetypes: (cb) ->
      m.Notetype.find(cb)
    
  },
  (err, results) ->
    if (err) then error(err); callback(err); return

    global.m.cache.courses = {}
    async.forEachSeries(results.courses, (course, cb) ->
      global.m.cache.courses[course.slug] = course

      course.getNotetypes((err, notetypes) ->
        if (err) then error(err); callback(err); return
        course.notetypes = notetypes
        cb(null)
      )

    , (err) ->

      callback(null)
    )
  )


