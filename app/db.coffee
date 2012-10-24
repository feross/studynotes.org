# Re-import these so this file can be included from the REPL
config = require './config'
async = require 'async'
_ = require 'underscore'

Sequelize = require 'sequelize'
chainer = new Sequelize.Utils.QueryChainer

#
# Database
#

global.sequelize = new Sequelize config.db.database, config.db.user, config.db.password,
  host: config.db.host
  omitNull: true
  # TODO: add db pooling

m = require './model'

# Create tables, if necessary
sequelize.sync(force: true)
  .success ->
    console.log 'Successfully synced DB'
  .error (err) ->
    console.error err


#
# Migrations
#

migrations =
  0: (cb) ->

    # insert some sample data
    async.series
      ap_us_history: (cb) ->
        m.Course.create(
          name: 'AP US History'
          description: 'a cool class'
          slug: 'ap-us-history'
        ).done cb
      ap_world_history: (cb) ->
        m.Course.create(
          name: 'AP World History'
          description: 'a really cool class'
          slug: 'ap-world-history'
        ).done cb
      vocabulary: (cb) ->
        m.NoteType.create(
          name: 'Vocabulary Terms'
          description: 'blah'
          slug: 'vocabulary'
        ).done cb
      chapter_1: (cb) ->
        m.Note.create(
          name: "Chapter 1"
          body: "These are some vocab words..."
          slug: "chapter-1"
        ).done cb

    , (err, r) ->
      console.log 'results'
      if !err
        r.ap_us_history.addNoteType r.vocabulary
        r.ap_world_history.addNoteType r.vocabulary

        debugger

        r.chapter_1.setNoteType r.vocabulary
        r.chapter_1.setCourse r.ap_us_history
        
      cb err



# db.migrate() runs migrations to update database to latest schema
exports.migrate = ->
  async.waterfall [
    (cb) ->
      m.Schema.count().done cb
    ,
    (count, cb) ->
      # Start schema at version -1
      if count == 0
        m.Schema.create(version: -1).done cb
      else
        cb null, count
    ,
    (count, cb) ->
      # Get current schema version
      m.Schema.find(where: {id: 1}).done cb
    ,
    (schema, cb) ->
      currentVersion = schema.version
      console.log "Current schema version: #{currentVersion}."

      # Preserve the id (key) of each migration
      newMigrations = _.map migrations, (val, key) ->
        id: parseInt(key)
        fn: val

      # Ignore migrations that are already applied
      newMigrations = _.filter newMigrations, (elem, i) ->
        elem.id > currentVersion 

      # Put migrations into sort order
      newMigrations = _.sortBy newMigrations, (elem, i) ->
        elem.id

      console.log newMigrations

      runMigration = (migration, cb) ->
        console.log migration.id
        console.log migration.fn

        migration.fn (err) ->
          if err
            cb "Error applying migration #{migration.id}. #{err}"
          else
            schema.version = migration.id
            schema.save().done (err) ->
              if !err
                console.log "Migration #{migration.id} applied."
              
              cb err

      console.log 'about to run migrations'
      # Run migrations sequentially
      async.forEachSeries newMigrations, runMigration, (err) ->
        cb err, schema.version


  ], (err, version) ->
    if err
      console.error 'Error during database migration.', err
    else
      console.log "Done migrating. Schema is now at: #{version}" 

          

  




