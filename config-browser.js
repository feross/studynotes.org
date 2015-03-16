var config = require('./config')

/** @type {number} in milliseconds (10-60s) */
exports.socketReconnectTimeout = Math.floor(Math.random() * 50000) + 10000

exports.wsEndpoint = config.isProd
  ? 'wss://' + config.siteHost + ':' + config.ports.liveupdater
  : 'ws://' + window.location.hostname + ':' + config.ports.liveupdater

exports.simpleEditor = {
  allowedContent: 'p strong b em i u ol ul li sub sup',
  autoGrow_minHeight: 100,
  autoGrow_onStartup: true,
  contentsCss: config.cdnOrigin + '/main.css',
  customConfig: '', // no external config file
  removePlugins: 'toolbar'
}

exports.richEditor = {
  allowedContent: 'p strong b em i u ol ul li h1 h2 h3 h4 h5 h6 sub sup',
  autoGrow_minHeight: 200,
  autoGrow_maxHeight: 400,
  autoGrow_onStartup: true,
  contentsCss: config.cdnOrigin + '/main.css',
  customConfig: '', // no external config file
  toolbarGroups: [
    { name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
    { name: 'editing', groups: [ 'find', 'selection', 'spellchecker' ] },
    { name: 'links' },
    { name: 'insert' },
    { name: 'forms' },
    { name: 'tools' },
    { name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
    { name: 'others' },
    { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
    { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },
    { name: 'styles' },
    { name: 'colors' },
    { name: 'about' }
  ],
  removeButtons: 'Cut,Copy,Paste,PasteFromWord,Undo,Redo,Subscript,Superscript,Outdent,Indent'
}
