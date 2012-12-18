# Logging functions for convenience
window.log = ->
  args = Array.prototype.slice.call(arguments, 0)
  console.log.apply(console, args)

window.error = ->
  args = Array.prototype.slice.call(arguments, 0)
  args.unshift('ERROR:')
  console.error.apply(console, args)