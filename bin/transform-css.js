var fs = require('fs')

var css = fs.readFileSync(process.argv[2], 'utf8')
css = css.replace(/\.\.\/fonts/g, '/font-awesome/fonts')
fs.writeFileSync(process.argv[2], css)