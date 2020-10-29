const $ = require('jquery')

const REMOVE_CONFIRMATION = 'Are you sure you want to PERMANENTLY remove this?'

module.exports = function () {
  $(function () {
    $(document).on('click', 'a[href="#"]', function (e) {
      e.preventDefault()

      const $elem = $(e.currentTarget)
      const action = $elem.data('action')

      if (action === 'remove' && !window.confirm(REMOVE_CONFIRMATION)) return

      const data = {
        model: $elem.data('model'),
        action: action,
        id: $elem.data('id')
      }

      $.post('/admin/', data)
        .done(function () {
          window.location.reload(true)
        })
    })
  })
}
