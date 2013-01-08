var _ = require('underscore')

var quotes = [
  ['Education is the most powerful weapon which you can use to change the world.', 'Nelson Mandela'],
  ['It is the mark of an educated mind to be able to entertain a thought without accepting it.', 'Aristotle'],
  ['Education is not the filling of a pail, but the lighting of a fire.', 'William Butler Yeats'],
  ['An investment in knowledge pays the best interest.', 'Benjamin Franklin'],
  ['Education is not preparation for life; education is life itself.', 'John Dewey'],
  ['Education is the key to unlock the golden door of freedom.', 'George Washington Carver'],
  ['Data is not information, information is not knowledge, knowledge is not understanding, understanding is not wisdom.', 'Clifford Stoll'],
  ['Education is a better safeguard of liberty than a standing army.', 'Edward Everett'],
  ['A little learning is a dangerous thing; Drink deep, or taste not the Pierian spring.', 'Alexander Pope'],
  ['The illiterate of the 21st century will not be those who cannot read and write, but those who cannot learn, unlearn, and relearn.', 'Alvin Toffler'],
  ['Always do your best. What you plant now, you will harvest later.', 'Og Mandino'],
  ['Well done is better than well said.', 'Benjamin Franklin'],
  ['Who seeks shall find.', 'Sophocles'],
  ['Learning is not attained by chance, it must be sought for with ardor and diligence.', 'Abigail Adams'],
  ['Stay hungry, stay foolish.', 'Steve Jobs'],
  ['To teach is to learn twice.', 'Joseph Joubert']
]

module.exports = function() {
  var quote = quotes[_.random(quotes.length - 1)]
  return '<span class="randomquote"><q>' + quote[0] + '</q> <span class="author">' +
         quote[1].replace(' ', '&nbsp;') + '</span></span>'
}