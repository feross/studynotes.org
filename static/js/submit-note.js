$('select[name="course"]').on('change', function (e) {
  if (!e.added) return

  var course = e.val
  var $notetype = $('select[name="notetype"]')

  $notetype
    .removeAttr('disabled')
    .children()
      .remove()
    .end()
    .append($('<option>'))

  $('select[name="allNotetypes"] option').each(function (i, opt) {
    var $opt = $(opt)
    if ($opt.data('course') === course) {
      $opt.clone().appendTo($notetype)
    }
  })

  $notetype.trigger('change')
})