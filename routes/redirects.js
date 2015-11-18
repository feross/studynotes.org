module.exports = function (app) {
  app.get('/r', function (req, res) {
    res.redirect('/')
  })

  app.get('/r/amazon', function (req, res) {
    res.redirect(301, 'http://www.amazon.com/ref=as_li_ss_tl?_encoding=UTF8&camp=1789&creative=390957&linkCode=ur2&tag=apstudynotes-20&linkId=BUMOMDOGLYIFKGIC')
  })

  app.get('/r/essayedge', function (req, res) {
    res.redirect(301, 'http://www.jdoqocy.com/click-7929089-10856568-1391449830000')
  })

  app.get('/r/grammarly', function (req, res) {
    res.redirect(301, 'http://www.dpbolvw.net/click-7929089-11001874-1423611562000')
  })
}
