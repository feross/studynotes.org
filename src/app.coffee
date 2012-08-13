global.config = require './config'
global._ = require 'underscore'

http = require 'http'
path = require 'path'
fs = require 'fs'

coffee = require 'coffee-script'
express = require 'express'
stylus = require 'stylus'
nib = require 'nib'

db = require './db'
routes = require './routes'

app = express()

compileStylus = (str, path) ->
  stylus(str)
    .set('filename', path)
    .set('compress', true)
    .use(nib())

app.set 'port', process.env.PORT || 3000
app.set 'views', __dirname + '/views'
app.set 'view engine', 'jade'
app.use express.favicon()
app.use express.logger 'dev'
app.use express.bodyParser()
app.use express.methodOverride()
app.use express.cookieParser('your secret here') # TODO
app.use express.session()
app.use express.static path.join __dirname, 'public'
app.use app.router
app.use stylus.middleware
  src: __dirname + '/public'
  compile: compileStylus



# Serve .coffee files as .js
app.get '/javascripts/:script.js', (req, res) ->
  res.header 'Content-Type', 'application/x-javascript'
  cs = fs.readFileSync "#{__dirname}/public/javascripts/#{req.params.script}.coffee", "ascii"
  js = coffee.compile cs 
  res.send js

if app.get 'env' == 'development'
  app.use express.errorHandler()

conn = db.connect()


app.get '/', routes.index
app.get '/ap-notes/:courseSlug/:noteTypeSlug/:noteSlug', routes.note
app.get '*', routes.notfound

http.createServer(app).listen app.get('port'), ->
  console.log 'Express server listening on port ' + app.get('port')
