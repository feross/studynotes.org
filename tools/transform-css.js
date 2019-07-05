#!/usr/bin/env node

var autoprefixer = require('autoprefixer')
var CleanCSS = require('clean-css')
var fs = require('fs')
var postcss = require('postcss')

var css = fs.readFileSync(process.argv[2], 'utf8')
css = css.replace(/select2x2\.png/g, 'https://cdn.apstudynotes.org/select2/select2x2.png')
css = css.replace(/\.\.\/font/g, 'https://cdn.apstudynotes.org/fontello/font')
css = new CleanCSS().minify(css).styles

postcss([autoprefixer])
  .process(css, { from: process.argv[2], to: process.argv[2] })
  .then(function (result) {
    result.warnings().forEach(function (warn) {
      console.warn(warn.toString())
    })
    css = result.css
    fs.writeFileSync(process.argv[2], css)
  })
