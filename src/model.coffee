Sequelize = require 'sequelize'


#
# Models
#

exports.Course = Course = sequelize.define 'Course',
  name:
    type: Sequelize.STRING
    allowNull: false
    unique: true
  description:
    type: Sequelize.TEXT
    allowNull: false
  slug:
    type: Sequelize.STRING
    unique: true
    allowNull: false
    validate:
      is: ['[-a-z]']  # only lower case letters and dashes


exports.NoteType = NoteType = sequelize.define 'NoteType',
  name:
    type: Sequelize.STRING
    allowNull: false
    unique: true
  description:
    type: Sequelize.TEXT
    allowNull: false
  slug:
    type: Sequelize.STRING
    unique: true
    allowNull: false
    validate:
      is: ['[-a-z]']  # only lower case letters and dashes


exports.Note = Note = sequelize.define 'Note',
  name:
    type: Sequelize.STRING
    allowNull: false
    unique: true
  body:
    type: Sequelize.TEXT
    allowNull: false
  slug:
    type: Sequelize.STRING
    # TODO: enforce unqiueness for each course and notetype combo
    allowNull: false
    validate:
      is: ['[-a-z]']  # only lower case letters and dashes


exports.Schema = Schema = sequelize.define 'Schema', {
  version:
    type: Sequelize.INTEGER
    allowNull: false
    default: 0
}, {
  freezeTableName: true
}


#
# Associations
#

Course.hasMany NoteType

Course.hasMany Note
NoteType.hasMany Note










