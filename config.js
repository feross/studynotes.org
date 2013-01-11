module.exports = {
  
  db: {
    host: PRODUCTION
      ? 'athena.feross.net'
      : 'localhost',
    port: '27017',
    database: 'studynotes'
  },

  redis: {
    host: PRODUCTION
      ? 'athena.feross.net'
      : 'localhost',
    port: 6379
  },

  siteTitle: 'Study Notes',
  siteUrl: PRODUCTION // no trailing slash
    ? 'http://www.apstudynotes.org'
    : 'http://local.apstudynotes.org:' + PORT

}
