function formatSelect2 (option) {
  var $elem = $(option.element)
  return '<img class="select2-icon" src="' + config.cdnOrigin + '/images/icon/' + $elem.val() + '.png"/>' + option.text
}

// Initialize select2 on <select> elements
$('.select2').select2({
  escapeMarkup: function(m) { return m },
  formatResult: formatSelect2,
  formatSelection: formatSelect2,
  matcher: function(term, text, opt) {
    return text.toLowerCase().indexOf(term.toLowerCase()) >= 0 ||
      (opt.attr('data-alt')
        && opt.attr('data-alt').toLowerCase().indexOf(term.toLowerCase()) >= 0)
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

if ($('textarea[name="prompt"]').length) {
  var promptEditor = CKEDITOR.replace('prompt', config.simpleEditor)
}

if ($('textarea[name="body"]').length) {
  var bodyEditor = CKEDITOR.replace('body', config.richEditor)
}