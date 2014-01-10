var config = require('../config')
var fs = require('fs')

var css = fs.readFileSync(process.argv[2], 'utf8')
css = css.replace(/\.\.\/fonts/g, config.cdnOrigin + '/node_modules/font-awesome/fonts')
fs.writeFileSync(process.argv[2], css)