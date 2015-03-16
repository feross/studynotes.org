/*global caches, fetch, Request */

var OFFLINE_CACHE = 'offline'
var OFFLINE_URL = '/offline.html'

self.addEventListener('install', function (event) {
  var offlineRequest = new Request(OFFLINE_URL)
  event.waitUntil(fetch(offlineRequest).then(function (response) {
    return caches.open(OFFLINE_CACHE).then(function (cache) {
      return cache.put(offlineRequest, response)
    })
  }))
})

self.addEventListener('fetch', function (event) {
  var method = event.request.method
  var headers = event.request.headers

  if (method === 'GET' && headers.get('accept').indexOf('text/html') !== -1) {
    console.log('Handling fetch event for', event.request.url)

    event.respondWith(fetch(event.request).catch(function (e) {
      console.error('Fetch failed; returning offline page instead.', e)

      return caches.open(OFFLINE_CACHE).then(function (cache) {
        return cache.match(OFFLINE_URL)
      })
    }))
  }
})
