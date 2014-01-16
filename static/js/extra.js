var config = require('../../config')

window.CKEDITOR_BASEPATH = config.secureOrigin + '/ckeditor/'
require('ckeditor')
