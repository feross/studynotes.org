module.exports = {
  db: {
    host: global.app.get('env') == 'development' ? 'localhost' : '192.168.176.154',
    port: '27017',
    database: 'studynotes'
  },
  siteurl: 'http://apstudynotes.org'
};
