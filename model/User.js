/*jslint node: true */
"use strict";

var bcrypt = require('bcrypt')
var model = require('./')
var md5 = require('MD5')
var mongoose = require('mongoose')
var plugin = require('./plugin')
var validate = require('mongoose-validator').validate

var User = new mongoose.Schema({
  _id: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    index: true,
    validate: [
      validate({ message: 'Please share your full name (first and last), don\'t be shy!' }, 'contains', ' '),
      validate({ message: 'Please share your name, don\'t be shy!' }, 'notEmpty')
    ]
  },
  email: {
    type: String,
    unique: true,
    validate: [
      validate({ message: 'Your email address is invalid!' }, 'isEmail'),
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
  college: {
    type: String,
    ref: 'College'
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  collegeMajor: String,
  collegeYear: {
    type: String,
    validate: [
      validate({ message: 'Only use numbers for your graduation year.' }, 'isNumeric')
    ]
  },
  admin: Boolean
})

// Trim whitespace
User.pre('save', function (next) {
  var user = this
  user.email = user.email.trim()
  user.name = user.name.trim()
  next()
})

User.virtual('url').get(function() {
  return '/user/' + this._id + '/'
})

User.virtual('firstName').get(function () {
  return this.name.split(' ')[0]
})

User.virtual('mlaName').get(function () {
  var split = this.name.split(' ')
  if (split.length >= 2) {
    return split[1] + ', ' + split[0]
  } else {
    return split[0]
  }
})

User.virtual('searchDesc').get(function () {
  return 'User'
})

User.virtual('hasGraduated').get(function () {
  if (this.collegeYear === undefined) return true
  return Number(this.collegeYear) <= (new Date()).getFullYear()
})

/**
 * Returns the URL to the user's Gravatar image, based on their email address.
 * If the user has nothing set, this returns a transparent PNG.
 */
User.virtual('gravatarBlank').get(function() {
  var hash = md5(this.email.trim().toLowerCase())
  return '//www.gravatar.com/avatar/' + hash + '?size=50&default=blank'
})

User.virtual('gravatar').get(function () {
  var hash = md5(this.email.trim().toLowerCase())
  return '//www.gravatar.com/avatar/' + hash + '?size=400&default=mm'
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
User.plugin(plugin.slug)
User.plugin(plugin.hits)

module.exports = mongoose.model('User', User)