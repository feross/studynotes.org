var bcrypt = require('bcrypt')
var model = require('./')
var md5 = require('MD5')
var mongoose = require('mongoose')
var plugin = require('./plugin')

var User = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  slug: model.SLUG_UNIQUE
})

User.virtual('url').get(function() {
  return '/user/' + this.slug + '/'
})

User.virtual('firstName').get(function () {
  return this.name.split(' ')[0]
})

User.virtual('searchDesc').get(function () {
  return 'User'
})

// Returns the URL to the user's Gravatar image, based on their email address.
// If the user has nothing set, this returns a transparent PNG.
User.virtual('gravatarUrl').get(function() {
  var hash = md5(this.email.trim().toLowerCase())
  return '//www.gravatar.com/avatar/' + hash + '?size=100&default=blank'
})

User.pre('save', function (next) {
  var user = this
  if (!user.isModified('password')) return next()

  // Hash the password and store it
  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) return next(err)
    user.password = hash
    next()
  })
})

User.methods.verifyPassword = function (password, cb) {
  bcrypt.compare(password, this.password, cb)
}

User.plugin(plugin.modifyDate)
User.plugin(plugin.createDate)
User.plugin(plugin.absoluteUrl)
User.plugin(plugin.slug, { model: 'User' })
User.plugin(plugin.hits)

module.exports = mongoose.model('User', User)