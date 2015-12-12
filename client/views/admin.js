var $ = require('jquery')

var REMOVE_CONFIRMATION = 'Are you sure you want to PERMANENTLY remove this?'

module.exports = function () {
  $(function () {
    $(document).on('click', 'a[href="#"]', function (e) {
      e.preventDefault()

      var $elem = $(e.currentTarget)
      var action = $elem.data('action')

      if (action === 'remove' && !window.confirm(REMOVE_CONFIRMATION)) return

      var data = {
        model: $elem.data('model'),
        action: action,
        id: $elem.data('id')
      }

      $.post('/admin/', data)
        .done(function () {
          window.location = window.location
        })
    })
  })
}
