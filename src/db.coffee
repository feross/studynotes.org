config = require './config'
async = require 'async'
_ = require 'underscore'

Sequelize = require 'sequelize'
chainer = new Sequelize.Utils.QueryChainer


global.sequelize = new Sequelize config.db.database, config.db.user, config.db.password,
  host: config.db.host
  omitNull: true
  # TODO: add db pooling

m = require './model'

# Create tables, if necessary
sequelize.sync()
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
    
    m.Course.create(
      name: 'AP US History'
      description: 'a cool class'
      slug: 'ap-us-history'
    ).done defer err, apUSHistory

    if err
      cb err
      return

    # m.NoteType.create

    cb null

  1: (cb) ->
    console.log 'lol'
    cb null

  2: (cb) ->

    m.Course.create(
      name: 'AP World History'
      description: 'a really cool class'
      slug: 'ap-world-history'
    ).done defer err, apUSHistory

    if err
      cb err
      return

    cb null


exports.migrate = ->
  console.log 'a'
  async.waterfall [
    (cb) ->
      m.Schema.count().done (err, count) ->
        console.log 'hi'
        console.log count
        cb err, count
    
    ,
    (cb, count) ->
      console.log count
      # Start schema at version -1
      if count == 0
        m.Schema.create(version: -1).done cb
      else
        cb null
    ,
    (cb) ->
      # Get current schema version
      m.Schema.findAll().done cb

    ,
    (cb, schemas) ->
      schema = schemas[0]
      currentVersion = schema.version
      console.log "Current schema version: #{currentVersion}."

      # Ignore migrations that are already applied
      newMigrations = _.filter migrations, (val, key) ->
        currentVersion >= parseInt(key)

      # Put migrations into sort order
      newMigrations = _.sortBy migrations, (val, key) ->
        parseInt(key)


      runMigration = (migration, cb) ->
        console.log i
        console.log migration

        migration (err) ->
          if err
            cb "Error applying migration #{i}. #{err}"
          else
            schema.version = i
            schema.save()
            console.log "Migration #{i} applied."
            cb null

      # Run migrations sequentially
      forEachSeries newMigrations, runMigration, cb


  ], (err) ->
    if err
      console.error 'Error during database migration', err
    else
      console.log "Done migrating. Schema is now at: #{schema.version}" 

          

  




