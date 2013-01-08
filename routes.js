var amazons = require('./amazons')
  , search = require('./search')
  , randomquote = require('./randomquote')

var routes = {
  home: {
    url: '/',
    hero: {
      title: 'AP* Study Notes',
      desc: 'Fast, free study tools for AP* students'
      // desc: 'The best AP* study guides'
      // desc: 'Study tools for smart students'
      // desc: 'The secret to getting a 5 on the AP* exam'
    }
  },

  'study-guides': {
    url: '/study-guides',
    meta: { title: 'Buy Amazon.com AP Study Guides' }
  },

  about: {
    url: '/about',
    meta: { title: 'About' },
    hero: {
      title: 'About StudyNotes',
      desc: 'We <span class="red">&hearts;</span> students and teachers!'
    }
  },

  contact: {
    url: '/contact',
    meta: { title: 'Contact Us' },
    hero: {
      title: 'Contact Us',
      desc: 'We\'d love to hear from you!'
    }
  },

  plagiarism: {
    url: '/plagiarism',
    meta: { title: 'Our Stance on Plagiarism' },
    hero: {
      title: 'Our Stance on Plagiarism',
      desc: 'Don\'t do it!'
    }
  },

  privacy: {
    url: '/privacy',
    meta: { title: 'Privacy Policy' },
    hero: {
      title: 'Privacy Policy',
      desc: '(good bedtime reading)'
    }
  },

  search: {
    url: '/search',
    handler: function (req, res){
      q = req.query.q
      
      render(res, 'search', {
        meta: { title: 'Search Results for ' + q },
        search_term: q
      })
    }
  },

  'autocomplete-endpoint': {
    url: '/autocomplete-endpoint',
    handler: function (req, res){
      q = req.query.q
      
      search.autocomplete(q, function(err, results){
        if (err) {
          error(err)
          res.send(500, { error: 'Search error' })
          return
        }
        res.send({
          q: q,
          results: results
        })
      })
    }
  },
    
  course: {
    url: '/:courseSlug',
    handler: function (req, res){
      var p = req.params
        , course = m.cache.courses[p.courseSlug]

      if (!course) {
        render404(res, 'No course with slug ' + p.courseSlug)
        return
      }

      render(res, 'course', {
        amazon: amazons[course.slug],
        cls: 'course ' + course.slug,
        course: course,
        hero: heroForCourse(course),
        notetypes: course.notetypes,
        meta: {
          url: course.absoluteUrl,
          title: course.name
        }
      })
    }
  },

  notetype: {
    url: '/:courseSlug/:notetypeSlug',
    handler: function (req, res){
      var p = req.params
        , course = m.cache.courses[p.courseSlug]

      if (!course) {
        render404(res, 'No course with slug ' + p.courseSlug)
        return
      }

      var notetype = u.find(course.notetypes, function (n){
        return n.slug == p.notetypeSlug
      })
      if (!notetype) {
        render404(res, 'Course has no notetype w/ slug ' + p.notetypeSlug)
        return
      }
      
      m.Note
      .find({ courseId: course._id, notetypeId: notetype._id })
      .sort('ordering')
      .exec(function (err, notes){
        if (err) {
          error(err)
          return
        }

        if (!notes) {
          render404(res, 'Unable to load notes')
          return
        }

        render(res, 'notetype', {
          amazon: amazons[course.slug],
          breadcrumbs: [ { name: course.name, url: course.url } ],
          cls: 'course ' + course.slug,
          course: course,
          hero: heroForCourse(course),
          notetype: notetype,
          notes: notes,
          meta: {
            url: notetype.absoluteUrl,
            title: course.name + ' ' + notetype.name
          }
        })
      })
    }
  },

  note: {
    url: '/:courseSlug/:notetypeSlug/:noteSlug',
    handler: function (req, res){
      var p = req.params
      , course = m.cache.courses[p.courseSlug]

      if (!course) {
        render404(res, 'No course with slug ' + p.courseSlug)
        return
      }

      var notetype = u.find(course.notetypes, function (n){
        return n.slug == p.notetypeSlug
      })
      if (!notetype) {
        render404(res, 'Course has no notetype with slug ' + p.notetypeSlug)
        return
      }
           
      m.Note
      .find({ courseId: course._id, notetypeId: notetype._id })
      .sort('ordering')
      .exec(function (err, notes){
        if (err) {
          error(err)
          return
        }

        if (!notes) {
          render404(res, 'Unable to load notes')
          return
        }

        var note = u.find(notes, function (n){
          return n.slug == p.noteSlug
        })

        if (!note) {
          render404(res, 'Course+notetype have no note w slug ' + p.noteSlug)
          return
        }

        var noteOrdering = note.ordering

        var noteNext = u.find(notes, function (note){
          return note.ordering == noteOrdering + 1
        })

        var notePrev = u.find(notes, function (note){
          return note.ordering == noteOrdering - 1
        })

        // Update hit count -- don't wait for confirmation
        note.update({ $inc: { hits: 1 } }, { upsert: true }, util.noop)

        render(res, 'note', {
          amazon: amazons[course.slug],
          breadcrumbs: [
            { name: course.name, url: course.url },
            { name: notetype.name, url: notetype.url }
          ],
          cls: 'course ' + course.slug,
          course: course,
          hero: heroForCourse(course),
          notetype: notetype,
          note: note,
          noteNext: noteNext,
          notePrev: notePrev,
          relatedNotes: notes,
          meta: {
            url: note.absoluteUrl,
            title: util.titleify(note.name, course.name + ' ' + notetype.name)
          }
        })
      })
    }
  },

  notFound: {
    url: '*',
    handler: function (req, res){
      render404(res)
    }
  }
}

//
// Initialize and register the app's routes
//

u.each(routes, function (locals, templateName){
  app.get(locals.url, function (req, res){

    // If locals.meta is missing `url`, try to add it
    // This is so that static pages will get the canonical url meta tag
    if ((!locals.meta || !locals.meta.url)
        && locals.url.indexOf(':') == -1
        && locals.url.indexOf('*') == -1) {
      
      var absoluteUrl = config.siteUrl + locals.url
      if (absoluteUrl[absoluteUrl.length - 1] != '/')
        absoluteUrl += '/'

      locals.meta = locals.meta || {}
      locals.meta.url = absoluteUrl
    }

    if (locals.handler) {
      locals.handler(req, res)
    } else {
      render(res, templateName, locals)
    }
  })
})


function heroForCourse (course) {
  return {
    title: course.name,
    desc: 'Class Notes, Test Prep, Review Materials, and More',
    url: course.absoluteUrl,
    tabs: course.notetypes
  }
}

/**
 * Render a template
 *
 * Adds variables that all templates will expect. We use this function so we
 * have one location to add all these variables. We also allow caller to
 * override the default values specified here by simply declaring them in the
 * object they pass as `locals`.
 * 
 * Use this function instead of calling res.render() directly. 
 * 
 * @param  {Object} res          Response Object
 * @param  {String} templateName Name of the template to render
 * @param  {Object} locals       Local variables to make available to template
 */
function render(res, templateName, locals) {
  var defaultLocals = {
    ads: PRODUCTION,
    cls: templateName,
    config: config,
    courses: m.cache.courses,
    search_term: '',
    randomquote: randomquote()
  }

  res.render(templateName, u.extend(defaultLocals, locals))
}


/**
 * Render 404 page, and log error message
 * 
 * @param  {Object} res Response Object
 * @param  {String} msg Error message to log
 */
function render404(res, msg) {
  if (msg) error(msg) // don't return since we want to serve a 404 page
  
  res.status(404)
  render(res, 'notFound',
    { err: msg
    , ads: false
    , meta:
      { title: 'Page Not Found - 404 Error'
      , forceTitle: true
      }
    }
  )
}