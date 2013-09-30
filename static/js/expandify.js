var $expandifys = $('.expandify')

$expandifys.each(function (i, elem) {
  var $expandify = $(elem)

  $expandify.append($('<div class="expandify-ghost">'))

  if ($expandify.find('.expandify-btn').length === 0
      && !$expandify.hasClass('no-btn')) {
    $expandify.append($('<div class="expandify-btn"><button class="btn small">Read more <i class="icon-chevron-down"></i></button></div>'))

    var $btn = $expandify.find('.expandify-btn')
    var $ghost = $expandify.find('.expandify-ghost')

    $btn.find('button').on('click', function () {
      $ghost.remove()
      $btn.remove()

      $expandify.addClass('expanded')
    })
  }
})