var config = require('../../config')

window.CKEDITOR_BASEPATH = config.secureCdnOrigin + '/ckeditor/'
require('ckeditor')
