const extend = require('xtend/mutable')
const model = require('../model')

module.exports = function (app) {
  app.get('/', async function (req, res, next) {
    let r
    try {
      const [noteCount, courseCount, essayCount, collegeCount, userCount, newNotes, newEssays] = await Promise.all([
        model.Note.countDocuments({ published: true }),
        model.Course.countDocuments(),
        model.Essay.countDocuments({ published: true }),
        model.College.countDocuments(),
        model.User.countDocuments(),
        model.Note
          .find({ published: true })
          .sort('-createDate')
          .limit(5)
          .select('-body -bodyTruncate')
          .populate('course notetype'),
        model.Essay
          .find({ published: true })
          .sort('-createDate')
          .limit(5)
          .select('-prompt -body -bodyPaywall -bodyTruncate')
          .populate('college')
      ])
      r = { noteCount, courseCount, essayCount, collegeCount, userCount, newNotes, newEssays }
    } catch (err) {
      return next(err)
    }

    const locals = {
      hero: {
        title: 'Study Notes',
        desc: 'Fast, free study guides. <span class="hide-mobile">Trusted <span class="totalHits small">millions of</span> times (and&nbsp;counting)</span>',
        descRaw: true,
        image: 'amjed.jpg'
        // desc: 'Fast, free study tools for AP students',
        // desc: 'The best AP study guides'
        // desc: 'Study tools for smart students'
        // desc: 'The secret to getting a 5 on the AP exam'
      },
      url: '/'
    }
    extend(locals, r)

    res.render('home', locals)
  })
}
