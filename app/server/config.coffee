module.exports = {
  
  db: {
    host: if global.app.get('env') == 'development' then 'localhost' else 'athena.feross.net'
    port: '27017'
    database: 'studynotes'
  }

  siteurl: 'http://apstudynotes.org'

}
