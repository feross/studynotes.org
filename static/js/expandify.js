var $expandifys = $('.expandify')

$expandifys.each(function (i, elem) {
  $expandify = $(elem)

  $expandify
    .append($('<div class="expandify-ghost">'))
    .append($('<div class="expandify-btn"><button class="btn small">Show more</button></div>'))

  var $ghost = $expandify.find('.expandify-ghost')
  var $btn = $expandify.find('.expandify-btn')

  $btn.find('button').on('click', function () {
    $ghost.remove()
    $btn.remove()

    $expandify.addClass('expanded')
  })
})