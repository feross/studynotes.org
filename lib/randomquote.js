/*jslint node: true */

var _ = require('underscore')

var quotes = [{
    text: 'Education is the most powerful weapon which you can use to change the world.',
    author: 'Nelson Mandela'
  }, {
    text: 'It is the mark of an educated mind to be able to entertain a thought without accepting it.',
    author: 'Aristotle'
  }, {
    text: 'Education is not the filling of a pail, but the lighting of a fire.',
    author: 'William Butler Yeats'
  }, {
    text: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin'
  }, {
    text: 'Education is not preparation for life; education is life itself.',
    author: 'John Dewey'
  }, {
    text: 'Education is the key to unlock the golden door of freedom.',
    author: 'George Washington Carver'
  }, {
    text: 'Data is not information, information is not knowledge, knowledge is not understanding, understanding is not wisdom.',
    author: 'Clifford Stoll'
  }, {
    text: 'Education is a better safeguard of liberty than a standing army.',
    author: 'Edward Everett'
  }, {
    text: 'A little learning is a dangerous thing; Drink deep, or taste not the Pierian spring.',
    author: 'Alexander Pope'
  }, {
    text: 'The illiterate of the 21st century will not be those who cannot read and write, but those who cannot learn, unlearn, and relearn.',
    author: 'Alvin Toffler'
  }, {
    text: 'Always do your best. What you plant now, you will harvest later.',
    author: 'Og Mandino'
  }, {
    text: 'Well done is better than well said.',
    author: 'Benjamin Franklin'
  }, {
    text: 'Who seeks shall find.',
    author: 'Sophocles'
  }, {
    text: 'Learning is not attained by chance, it must be sought for with ardor and diligence.',
    author: 'Abigail Adams'
  }, {
    text: 'Stay hungry, stay foolish.',
    author: 'Steve Jobs'
  }, {
    text: 'To teach is to learn twice.',
    author: 'Joseph Joubert'
  }
]

module.exports = function() {
  return quotes[_.random(quotes.length - 1)]
}