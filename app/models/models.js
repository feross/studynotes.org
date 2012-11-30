module.exports = function(callback) {

  var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , plugin = require('./plugin');

  /*
   * Fields that are re-used many times.
   */
  var SLUG = {
    type: String,
    match: /[-a-z0-9]+/i,
    lowercase: true,
  };
  var SLUG_UNIQUE = u.extend({}, SLUG, { unique: true });

  var schemas = {
    
    Course: {
      name: { type: String, required: true, unique: true },
      desc: String,
      notetypes: [{ type: Schema.Types.ObjectId, ref: 'Notetype'}],
      slug: SLUG_UNIQUE,
      image: String
    },

    Notetype: {
      name: { type: String, required: true, unique: true },
      desc: String,
      ordering: Number,
      slug: SLUG_UNIQUE
    },

    Note: {
      name: { type: String, required: true },
      body: { type: String, required: true },
      courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
      notetypeId: { type: Schema.Types.ObjectId, ref: 'Notetype', required: true },
      ordering: Number,
      slug: SLUG,
      setup: function() {
        // No duplicate names or slugs for a course+notetype.
        this.index({ courseId: 1, notetypeId: 1, slug: 1 }, { unique: true });
        this.index({ courseId: 1, notetypeId: 1, name: 1 }, { unique: true });

        this.index({ courseId: 1, notetypeId: 1});
      }
    }

  }

  /*
   * Setup up schemas and models.
   */

  var models = {};
  u.each(schemas, function (fields, name) {
    
    /*
     * Remove the setup function from the fields object before creating a Schema,
     * but save it to be invoked later.
     */
    var setup = fields.setup;
    fields = u.omit(fields, 'setup');

    var schema = new Schema(fields);

    /*
     * Automatic slug generation.
     * 
     * If schema has a slug field, set up a pre-save hook to check for existence of slug.
     * When no slug is set at save time, we automatically generate one.
     */
    if (fields.slug) {
      schema.pre('save', function(next) {
        var doc = this;

        // If no slug is set, automatically generate one
        if (!doc.slug) {
          var potentialSlug, initialSlug, num, done;

          potentialSlug = initialSlug = util.slugify(doc.name);
          num = 0; // number to try appending to slug in order to make it unique
          
          async.whilst(
            function () {
              // Try appending a number to the end of the slug, after the first try
              if (num > 0) {
                potentialSlug = initialSlug + '-' + num;
              }
              num += 1;
              return !done;
            },
            function (cb) {
              doc.model(name).count({ slug: potentialSlug }, function (err, count) {
                if (err) { cb(err); return; }
                if (count == 0) {
                  doc.slug = potentialSlug;
                  done = true;
                }
                cb();
              });
            },
            function (err) {
              if (err) { error(err); }
              next();
            }
          );

        } else {
          next();
        }
      });
    }

    // Add date and hits fields to all schemas
    schema.plugin(plugin.modifyDate);
    schema.plugin(plugin.createDate);
    schema.plugin(plugin.hits);

    // run setup function (usually to set up multi-indices) if one exists
    if (setup) {
      setup.call(schema);
    }

    models[name] = db.model(name, schema);
  });

  global.m = models;

  /*
   * Cache commonly accessed data
   */
  global.m.cache = {};
  async.waterfall([
    function (cb) {
      m.Course
      .find()
      .populate('notetypes')
      .exec(cb);
    }
  ], function (err, result) {
    if (err) { error(err); callback(err); return; }

    var courses = {};
    u.each(result, function(course) { courses[course.slug] = course; });
    global.m.cache.courses = courses;

    callback(null);
  });

};