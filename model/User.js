var auto = require('run-auto')
var bcrypt = require('bcrypt')
var config = require('../config')
var mail = require('../lib/mail')
var md5 = require('md5')
var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')
var validate = require('mongoose-validator')

var User = new mongoose.Schema({
  _id: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    index: true,
    required: 'We need a name to create your account.',
    validate: [
      validate({
        validator: 'contains',
        arguments: ' ',
        message: 'Please use your full name. Don\'t be shy :)'
      }),
      validate({
        validator: 'isLength',
        arguments: 3,
        message: 'We need a name to create your account.'
      })
    ]
  },
  email: {
    type: String,
    unique: true,
    required: 'We need an email address to create your account.',
    validate: [
      validate({
        validator: 'isEmail',
        message: 'Your email address is invalid.'
      }),
      validate({
        validator: 'isLength',
        arguments: 3,
        message: 'We need an email address to create your account.'
      })
    ]
  },
  emailLowerCase: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    validate: [
      validate({
        validator: 'isLength',
        arguments: [ 6, 255 ],
        message: 'Your password must be at least 6 characters.'
      })
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
      validate({
        validator: 'isNumeric',
        passIfEmpty: true,
        message: 'Only use numbers for your graduation year.'
      })
    ]
  },
  pro: Boolean,
  admin: Boolean,
  resetPasswordToken: String,
  resetPasswordExpires: Date
})

User.virtual('url').get(function () {
  return '/user/' + this._id + '/'
})

User.methods.getUrl = function (anon) {
  return anon
    ? '/anon/'
    : this.url
}

User.methods.getName = function (anon) {
  return anon
    ? 'Anonymous Student'
    : this.name
}

User.virtual('firstName').get(function () {
  return this.name.split(' ')[0]
})

User.virtual('lastName').get(function () {
  return this.name.split(' ').slice(1).join(' ')
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
  var self = this
  auto({
    essays: function (cb) {
      model.Essay
        .find({ user: self.id, anon: false, published: true })
        .select('-prompt -body -bodyPaywall -bodyTruncate')
        .exec(cb)
    },
    notes: function (cb) {
      model.Note
        .find({ user: self.id, anon: false, published: true })
        .select('-body -bodyTruncate')
        .exec(cb)
    }
  }, function (err, r) {
    if (err) cb(err)
    var essayHits = r.essays.reduce(function (total, essay) {
      return total + essay.hits
    }, 0)
    var totalHits = r.notes.reduce(function (total, note) {
      return total + note.hits
    }, essayHits)

    cb(totalHits)
  })
}

/**
 * Returns the URL to the user's Gravatar image, based on their email address.
 * @param {number} size
 * @param {boolean} transparent when no gravatar found, use transparent png
 */
User.methods.gravatar = function (size, transparent) {
  size = size || 50
  var fallback = transparent ? 'blank' : 'mm'
  var hash = md5(this.emailLowerCase)
  return '//www.gravatar.com/avatar/' + hash + '?size=' + size + '&default=' + fallback
}

// Trim whitespace
User.pre('validate', function (next) {
  var self = this
  if (typeof self.email === 'string') {
    self.email = self.email.trim()
    if (self.isModified('email')) self.emailLowerCase = self.email.toLowerCase()
  }
  if (typeof self.name === 'string') self.name = self.name.trim()
  next()
})

User.pre('save', function (next) {
  var self = this
  self.wasNew = self.isNew // for post-save

  if (self.isModified('password')) {
    // Store hashed version of user's password
    bcrypt.hash(self.password, 10, function (err, hash) {
      if (err) return next(err)
      self.password = hash
      next()
    })
  } else {
    next()
  }
})

User.post('save', function (user) {
  if (!user.wasNew) return

  // Send signup email
  var message = {}
  message.to = user.email
  message.subject = 'Welcome to Study Notes'

  message.text = 'Hi ' + user.name.split(' ')[0] + ',\n\n' +

    'Thanks for signing up for Study Notes (' + config.siteOrigin + ').\n\n' +

    'I\'m Feross, the founder and CEO of Study Notes. I wanted to personally ' +
    'reach out to welcome you to Study Notes.\n\n' +

    'We are building the best and simplest learning tools to empower ' +
    'students to accelerate their learning – i.e. to learn more ' +
    'effectively, in a shorter time, and with better long-term recall.\n\n' +

    'Study Notes is used by millions of students in all 50 U.S. states to ' +
    'prepare for AP exams and college admissions.\n\n' +

    'If you have any questions about the site, you can reply to this ' +
    'email.\n\n' +

    '— Feross'

  mail.send(message, function (err) {
    if (err) throw err
  })

  // subscribe the user to MailChimp "Study Notes Users" list
  mail.subscribeUser(user, function (err) {
    if (err) throw err
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
