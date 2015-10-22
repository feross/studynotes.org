var $ = require('jquery')

module.exports = function () {
  $(function () {
    $('a[href="#"]').click(function (e) {
      e.preventDefault()

      var $elem = $(e.target)
      var body = {
        model: $elem.data('model'),
        action: $elem.data('action'),
        id: $elem.data('id')
      }

      $.post('/admin/', body)
        .done(function () {
          window.location = window.location
        })
        .fail(function () {
          window.alert('Failed to complete action')
        })
    })
  })
}
