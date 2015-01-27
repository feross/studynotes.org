var $ = require('jquery')
var config = require('../config')

function formatSelect2 (option) {
  var $elem = $(option.element)
  return '<img class="select2-icon" src="' + config.cdnOrigin + '/images/icon/' + $elem.val() + '.png"/>' + option.text
}

// Initialize select2 on <select> elements
$(function () {
  var $select2 = $('.select2')
  if ($select2.length) {
    $select2.select2({
      escapeMarkup: function (m) { return m },
      formatResult: formatSelect2,
      formatSelection: formatSelect2,
      matcher: function (term, text, opt) {
        return text.toLowerCase().indexOf(term.toLowerCase()) >= 0 ||
          (opt.attr('data-alt')
            && opt.attr('data-alt').toLowerCase().indexOf(term.toLowerCase()) >= 0)
      }
    })
  }
})

var $selectCollege = $('select[name="college"]')
var $style = $('#heroStyle')
var currentHero = $selectCollege.val() || 'amjed'

if ($style.length) {
  $selectCollege.on('change', function () {
    var newHero = $(this).val()

    var html = $style.html()
      .replace(new RegExp(currentHero + '\\.jpg', 'g'), newHero + '.jpg')
    $style.html(html)

    currentHero = newHero
  })
}

$(function () {
  if ($('textarea[name="prompt"]').length) {
    window.CKEDITOR.replace('prompt', config.simpleEditor)
  }

  if ($('textarea[name="body"]').length) {
    window.CKEDITOR.replace('body', config.richEditor)
  }
})
