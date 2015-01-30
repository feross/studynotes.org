var config = require('../config')
var express = require('express')
var formage = require('formage')
var http = require('http')
var model = require('../model')

var app = express()
app.set('view options', { layout: false, pretty: true })

app.use(express.favicon())
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(express.cookieParser('magical secret admin'))
app.use(express.cookieSession({cookie: { maxAge: 1000 * 60 * 60 * 24 }}))
formage.serve_static(app, express)

app.locals('pretty', true)
app.use(express.logger('dev'))
app.use(express.errorHandler())

model.connect(function (err) {
  if (err) throw err

  formage.init(app, express, model.models, {
    title: 'Formage Admin',
    default_section: 'Main',
    admin_users_gui: true,
    username: 'admin',
    password: 'admin'
  })
})

app.get('/', function (req, res) {
  res.redirect(301, '/admin')
})

http.createServer(app).listen(config.ports.admin, function () {
  console.log('Express server listening on port ' + config.ports.admin)
})

exports.app = app
