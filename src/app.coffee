express = require 'express'
routes = require './routes'
http = require 'http'
path = require 'path'
stylus = require 'stylus'
nib = require 'nib'

app = express()

compileStylus = (str, path) ->
  stylus(str)
    .set('filename', path)
    .set('compress', true)
    .use(nib())

app.configure ->
  app.set 'port', process.env.PORT || 3000
  app.set 'views', __dirname + '/views'
  app.set 'view engine', 'jade'
  app.use express.favicon()
  app.use express.logger 'dev'
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use express.cookieParser('your secret here') # TODO
  app.use express.session()
  app.use app.router
  app.use stylus.middleware
    src: __dirname + '/public'
    compile: compileStylus
  app.use express.static path.join __dirname, 'public'

app.configure 'development', ->
  app.use express.errorHandler()

app.get '/', routes.index

http.createServer(app).listen app.get('port'), ->
  console.log 'Express server listening on port ' + app.get('port')
