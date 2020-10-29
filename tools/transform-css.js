#!/usr/bin/env node

const autoprefixer = require('autoprefixer')
const CleanCSS = require('clean-css')
const fs = require('fs')
const postcss = require('postcss')

let css = fs.readFileSync(process.argv[2], 'utf8')
css = css.replace(/select2x2\.png/g, 'https://www.apstudynotes.org/select2/select2x2.png')
css = css.replace(/\.\.\/font/g, 'https://www.apstudynotes.org/fontello/font')
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
