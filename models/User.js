var bcrypt = require('bcrypt')
var model = require('./')
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

User.virtual('searchDesc').get(function () {
  return 'User'
})

User.pre('save', function (next) {
  if (!this.isModified('password')) return next()

  // Hash the password and store it
  bcrypt.hash(this.password, 10, function (err, hash) {
    if (err) return next(err)
    this.password = hash
    next()
  })
})

User.methods.comparePassword = function (password, cb) {
  bcrypt.compare(password, this.password, function (err, isMatch) {
    if (err) return cb(err)
    cb(null, isMatch)
  })
}

User.plugin(plugin.modifyDate)
User.plugin(plugin.createDate)
User.plugin(plugin.absoluteUrl)
User.plugin(plugin.slug)
User.plugin(plugin.hits)

module.exports = mongoose.model('User', User)