// Browser-specific configuration

/** @type {number} 10-60s */
config.socketReconnectTimeout = Math.floor(Math.random() * 50000) + 10000

config.engineEndpoint = 'ws://' + window.location.hostname + ':' + config.ports.liveupdater

config.simpleEditor = {
  allowedContent: 'p strong b em i u ol ul li sub sup',
  autoGrow_minHeight: 100,
  autoGrow_onStartup: true,
  contentsCss: '/out/css/main.css',
  customConfig: '', // no external config file
  removePlugins: 'toolbar'
}

config.richEditor = {
  allowedContent: 'p strong b em i u ol ul li h1 h2 h3 h4 h5 h6 sub sup',
  autoGrow_minHeight: 200,
  autoGrow_maxHeight: 400,
  autoGrow_onStartup: true,
  contentsCss: '/out/css/main.css',
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