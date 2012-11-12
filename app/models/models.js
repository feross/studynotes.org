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
    unique: true
  };
  var SLUG_UNIQUE = u.extend(SLUG, { unique: true });


  var schemas = {
    
    Course: {
      name: { type: String, required: true, unique: true },
      desc: String,
      notetypes: [{ type: Schema.Types.ObjectId, ref: 'Notetype'}],
      slug: SLUG_UNIQUE
    },

    Notetype: {
      name: { type: String, required: true, unique: true },
      desc: String,
      slug: SLUG_UNIQUE
    },

    Note: {
      name: { type: String, required: true },
      body: { type: String, required: true },
      courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
      notetypeId: { type: Schema.Types.ObjectId, ref: 'Notetype', required: true },
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

          potentialSlug = initialSlug = u.util.slugify(doc.name);
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
                if (err) console.error(err);
                if (count == 0) {
                  doc.slug = potentialSlug;
                  done = true;
                }
                cb();
              });
            },
            function (err) { 
              next();
            }
          );

        } else {
          next();
        }
      });
    }

    // Add date fields to all schemas
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
    },
    function (result, cb) {
      // MIGRATE
/*      courses = result;

      var mysql = require('mysql');

      var connection = mysql.createConnection({
        host     : '74.207.246.197',
        user     : 'studynotes',
        password : 'Fh37sfblss',
        database : 'studynotes_ap'
      });

      connection.connect();

      connection.query('SELECT * FROM apsn_content WHERE sectionid = 6 AND catid = 65 AND state = 1', function(err, rows, fields) {
        if (err) throw err;

        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          console.log(row.title);
          var note = new m.Note({
            name: row.name,
            slug: row.alias,
            body: row.introtext,
            createDate: Date(row.created),
            courseId: u.(courses, function(course) { return course.slug == 'ap-us-his'});
          });
        }
      });*/
      cb(null, result);
    }
  ], function (err, result) {
    if (err) console.log(err);
    global.m.cache.courses = result;
    callback(null);
  });

};