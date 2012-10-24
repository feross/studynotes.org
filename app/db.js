// Re-import these global includes locally so this file can be included from the REPL
var config = require('./config')
  , async = require('async')
  , _ = require('underscore');

var Sequelize = require('sequelize')
  , chainer = new Sequelize.Utils.QueryChainer;

global.sequelize = new Sequelize(config.db.database, config.db.user, config.db.password, {
  host: config.db.host,
  omitNull: true
});

var m = require('./model');

sequelize.sync({
  force: true
}).success(function() {
  return console.log('Successfully synced DB');
}).error(function(err) {
  return console.error(err);
});

migrations = {
  0: function(cb) {
    return async.series({
      ap_us_history: function(cb) {
        return m.Course.create({
          name: 'AP US History',
          description: 'a cool class',
          slug: 'ap-us-history'
        }).done(cb);
      },
      ap_world_history: function(cb) {
        return m.Course.create({
          name: 'AP World History',
          description: 'a really cool class',
          slug: 'ap-world-history'
        }).done(cb);
      },
      vocabulary: function(cb) {
        return m.NoteType.create({
          name: 'Vocabulary Terms',
          description: 'blah',
          slug: 'vocabulary'
        }).done(cb);
      },
      chapter_1: function(cb) {
        return m.Note.create({
          name: "Chapter 1",
          body: "These are some vocab words...",
          slug: "chapter-1"
        }).done(cb);
      }
    }, function(err, r) {
      console.log('results');
      if (!err) {
        r.ap_us_history.addNoteType(r.vocabulary);
        r.ap_world_history.addNoteType(r.vocabulary);
        debugger;
        r.chapter_1.setNoteType(r.vocabulary);
        r.chapter_1.setCourse(r.ap_us_history);
      }
      return cb(err);
    });
  }
};

exports.migrate = function() {
  return async.waterfall([
    function(cb) {
      return m.Schema.count().done(cb);
    }, function(count, cb) {
      if (count === 0) {
        return m.Schema.create({
          version: -1
        }).done(cb);
      } else {
        return cb(null, count);
      }
    }, function(count, cb) {
      return m.Schema.find({
        where: {
          id: 1
        }
      }).done(cb);
    }, function(schema, cb) {
      var currentVersion, newMigrations, runMigration;
      currentVersion = schema.version;
      console.log("Current schema version: " + currentVersion + ".");
      newMigrations = _.map(migrations, function(val, key) {
        return {
          id: parseInt(key),
          fn: val
        };
      });
      newMigrations = _.filter(newMigrations, function(elem, i) {
        return elem.id > currentVersion;
      });
      newMigrations = _.sortBy(newMigrations, function(elem, i) {
        return elem.id;
      });
      console.log(newMigrations);
      runMigration = function(migration, cb) {
        console.log(migration.id);
        console.log(migration.fn);
        return migration.fn(function(err) {
          if (err) {
            return cb("Error applying migration " + migration.id + ". " + err);
          } else {
            schema.version = migration.id;
            return schema.save().done(function(err) {
              if (!err) {
                console.log("Migration " + migration.id + " applied.");
              }
              return cb(err);
            });
          }
        });
      };
      console.log('about to run migrations');
      return async.forEachSeries(newMigrations, runMigration, function(err) {
        return cb(err, schema.version);
      });
    }
  ], function(err, version) {
    if (err) {
      return console.error('Error during database migration.', err);
    } else {
      return console.log("Done migrating. Schema is now at: " + version);
    }
  });
};

