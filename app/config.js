module.exports = {
  db: {
    host: global.app.get('env') == 'development' ? 'localhost' :'192.168.176.246',
    user: 'studynotes',
    port: '27017',
    database: 'studynotes'
  },
  siteurl: 'http://apstudynotes.org'
};
