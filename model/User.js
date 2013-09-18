var bcrypt = require('bcrypt')
var model = require('./')
var md5 = require('MD5')
var mongoose = require('mongoose')
var plugin = require('./plugin')
var validate = require('mongoose-validator').validate

var User = new mongoose.Schema({
  name: {
    type: String,
    index: true,
    validate: [
      validate({ message: 'Please use your full name (first and last).' }, 'contains', ' '),
      validate({ message: 'Please share your name, don\'t be shy!' }, 'notEmpty')
    ]
  },
  email: {
    type: String,
    unique: true,
    validate: [
      validate({ message: 'Your email address is incorrect!' }, 'isEmail'),
      validate({ message: 'An email address is required.' }, 'notEmpty')
    ]
  },
  password: {
    type: String,
    validate: [
      validate({ message: 'Your password must be at least 6 characters long!' }, 'len', 6, 255),
      validate({ message: 'You need a password, silly!' }, 'notEmpty')
    ]
  },
  slug: model.SLUG_UNIQUE
})

// Trim whitespace
User.pre('save', function (next) {
  var user = this
  user.email = user.email.trim()
  user.name = user.name.trim()
  next()
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

// Store hashed version of user's password
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

User.methods.comparePassword = function (password, cb) {
  bcrypt.compare(password, this.password, cb)
}

User.plugin(plugin.modifyDate)
User.plugin(plugin.createDate)
User.plugin(plugin.absoluteUrl)
User.plugin(plugin.slug, { model: 'User' })
User.plugin(plugin.hits)

module.exports = mongoose.model('User', User)