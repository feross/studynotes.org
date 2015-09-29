#!/usr/bin/env node

var CleanCSS = require('clean-css')
var fs = require('fs')

var css = fs.readFileSync(process.argv[2], 'utf8')
css = css.replace(/select2x2\.png/g, 'https://cdn.apstudynotes.org/select2/select2x2.png')
css = css.replace(/\.\.\/font/g, 'https://cdn.apstudynotes.org/fontello/font')
css = new CleanCSS().minify(css).styles

fs.writeFileSync(process.argv[2], css)
