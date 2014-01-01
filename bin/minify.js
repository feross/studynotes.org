var closure = require('closurecompiler')
var fs = require('fs')

var filename = process.argv[2]

closure.compile([ filename ], {
  compilation_level: 'SIMPLE_OPTIMIZATIONS'
}, function (err, result) {
  if (!result) throw err // `err` could be just warnings, so check for `result`
  fs.writeFileSync(filename, result)
})
