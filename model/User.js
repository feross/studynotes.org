var _ = require('underscore')
var auto = require('run-auto')
var bcrypt = require('bcrypt')
var config = require('../config')
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
      validate({ message: 'Please share your entire name - don\'t be shy!' }, 'contains', ' '),
      validate({ message: 'Please share your name - don\'t be shy!' }, 'notEmpty')
    ]
  },
  email: {
    type: String,
    unique: true,
    validate: [
      validate({ message: 'Your email address is invalid.' }, 'isEmail'),
      validate({ message: 'An email address is required.' }, 'notEmpty')
    ]
  },
  password: {
    type: String,
    validate: [
      validate({ message: 'Your password must be at least 6 characters.' }, 'len', 6, 255),
      validate({ message: 'You need a password, silly!' }, 'notEmpty')
    ]
  },
  college: {
    type: String,
    ref: 'College'
  },
  collegeMajor: String,
  collegeYear: {
    type: String,
    validate: [
      validate({ passIfEmpty: true, message: 'Only use numbers for your graduation year.' }, 'isNumeric')
    ]
  },
  pro: Boolean,
  admin: Boolean,
  resetPasswordToken: String,
  resetPasswordExpires: Date
})

// Trim whitespace
User.pre('validate', function (next) {
  var user = this
  user.email = user.email && user.email.trim()
  user.name = user.name && user.name.trim()
  next()
})

User.virtual('url').get(function() {
  return '/user/' + this._id + '/'
})

User.methods.getUrl = function (anon) {
  if (anon)
    return '/anon/'
  else
    return this.url
}

User.methods.getName = function (anon) {
  if (anon) {
    return 'Anonymous Student'
  } else {
    return this.name
  }
}

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

User.methods.getMlaName = function (anon) {
  if (anon) {
    return 'Anonymous Student'
  } else {
    return this.mlaName
  }
}

User.virtual('searchDesc').get(function () {
  return 'User'
})

User.virtual('hasGraduated').get(function () {
  if (this.collegeYear === undefined) return true
  return Number(this.collegeYear) <= (new Date()).getFullYear()
})

User.methods.totalHits = function (cb) {
  var user = this
  auto({
    essays: function (cb) {
      model.Essay
        .find({ user: user.id, anon: false })
        .select('-prompt -body')
        .exec(cb)
    },
    notes: function (cb) {
      model.Note
        .find({ user: user.id, anon: false })
        .select('-body')
        .exec(cb)
    }
  }, function (err, r) {
    if (err) cb(err)
    var essayHits = _(r.essays).reduce(function (total, essay) {
      return total + essay.hits
    }, 0)
    var totalHits = _(r.notes).reduce(function (total, note) {
      return total + note.hits
    }, essayHits)

    cb(totalHits)
  })
}

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

User.methods.getGravatar = function (anon) {
  if (anon)
    return config.cdnOrigin + '/images/anon.jpg'
  else
    return this.gravatar
}

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

module.exports = User
