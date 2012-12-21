module.exports = {
  
  db: {
    host: if PRODUCTION then 'athena.feross.net' else 'localhost'
    port: '27017'
    database: 'studynotes'
  }

  siteTitle: 'Study Notes'
  siteUrl: 'http://www.apstudynotes.org' # no trailing slash

}
