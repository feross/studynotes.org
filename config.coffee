module.exports = {
  
  db: {
    host: if PRODUCTION then 'athena.feross.net' else 'localhost'
    port: '27017'
    database: 'studynotes'
  }

  siteurl: 'http://www.apstudynotes.org'

}
