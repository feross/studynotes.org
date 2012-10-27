var Sequelize = require('sequelize');


// Models

var Course = exports.Course = sequelize.define('Course', {
  title: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  desc: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  slug: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
    validate: {
      is: ['[-a-z]'] // only lower case letters and dashes
    }
  }
});

var NoteType = exports.NoteType = sequelize.define('NoteType', {
  title: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  desc: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  slug: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
    validate: {
      is: ['[-a-z]'] // only lower case letters and dashes
    }
  }
});

var Note = exports.Note = sequelize.define('Note', {
  title: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  body: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  slug: {
    type: Sequelize.STRING,
    // TODO: enforce unqiueness for each course and notetype combo
    allowNull: false,
    validate: {
      is: ['[-a-z]'] // only lower case letters and dashes
    }
  }
});

var Schema = exports.Schema = sequelize.define('Schema', {
  version: {
    type: Sequelize.INTEGER,
    allowNull: false,
    "default": 0
  }
}, {
  freezeTableName: true
});


// Associations

Course.hasMany(NoteType);
Course.hasMany(Note);

// NoteType.hasOne(Course);
NoteType.hasMany(Note);

// Note.hasOne(Course);
// Note.hasOne(NoteType);
