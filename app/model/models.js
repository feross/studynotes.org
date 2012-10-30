var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , p = require('./plugin')
  , db = require('./index').db;

var CourseSchema = new Schema({
  _id: {
    type: String,
    required: true,
    unique: true,
    match: /[-a-z0-9]+/i,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  desc: {
    type: String
  },
  notetypes: {
    type: [String],
  }
},
{strict: true});

CourseSchema.virtual('slug').get(function () {
  return this._id;
});
CourseSchema.plugin(p.modifyDate);
CourseSchema.plugin(p.createDate);


var NotetypeSchema = new Schema({
  _id: {
    type: String,
    required: true,
    unique: true,
    match: /[-a-z0-9]+/i,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  desc: {
    type: String
  }
},
{strict: true});

NotetypeSchema.virtual('slug').get(function () {
  return this._id;
});
NotetypeSchema.plugin(p.modifyDate);
NotetypeSchema.plugin(p.createDate);


var NoteSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    match: /[-a-z0-9]+/i,
    lowercase: true,
  },
  courseId: {
    type: String,
    required: true
  },
  notetypeId: {
    type: String,
    required: true
  }
},
{strict: true});

// No duplicate names or slugs within a course+notetype.
NoteSchema.index({ courseId: 1, notetypeId: 1, slug: 1 }, { unique: true });
NoteSchema.index({ courseId: 1, notetypeId: 1, name: 1 }, { unique: true });

NoteSchema.index({ courseId: 1, notetypeId: 1});

NoteSchema.plugin(p.modifyDate);
NoteSchema.plugin(p.createDate);



// Create and list all models here to expose them to the rest of the app
_.extend(global.m, {
  Course: m.db.model('Course', CourseSchema),
  Notetype: m.db.model('Notetype', NotetypeSchema),
  Note: m.db.model('Note', NoteSchema)
});