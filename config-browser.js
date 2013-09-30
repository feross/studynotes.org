// Browser-specific configuration

/** @type {number} 10-60s */
config.socketReconnectTimeout = Math.floor(Math.random() * 50000) + 10000

config.engineEndpoint = 'ws://' + window.location.hostname + ':' + config.ports.liveupdater