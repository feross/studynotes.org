module.exports = {
  
  db: {
    host: if global.app.get('env') == 'development' then 'localhost' else '192.168.176.154'
    port: '27017'
    database: 'studynotes'
  }

  siteurl: 'http://apstudynotes.org'

}
