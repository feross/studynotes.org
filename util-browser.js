exports.insertScript = function (src, cb) {
  const script = document.createElement('script')
  script.async = true
  script.src = src
  script.onload = cb || function () {}
  document.body.appendChild(script)
}
