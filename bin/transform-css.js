#!/usr/bin/env node

var fs = require('fs')

var css = fs.readFileSync(process.argv[2], 'utf8')
css = css.replace(/\.\.\/fonts/g, 'https://cdn.apstudynotes.org/font-awesome/fonts')
css = css.replace(/select2x2\.png/g, 'https://cdn.apstudynotes.org/select2/select2x2.png')
fs.writeFileSync(process.argv[2], css)
