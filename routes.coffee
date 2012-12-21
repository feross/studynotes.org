amazons = require('./amazons')

# 
# Render a template.
# 
# Adds variables that all templates will expect. We use this function so we
# have one location to add all these variables. We also allow caller to
# override the default values specified here by simply declaring them in the
# object they pass as `locals`.
# 
# Use this function instead of calling res.render() directly. 
# 
render = (res, templateName, locals) ->
  res.render(templateName, u.extend({
    ads: PRODUCTION,
    cls: templateName,
    config: config,
    courses: m.cache.courses,
    search_term: '',
    topnav: topnav
  }, locals))


#
# Render 404 page, and log error message
#
render404 = (res, msg) ->
  if (msg) then error(msg) # don't return since we want to serve a 404 page
  
  res.status(404)
  render(res, 'notFound', {
    err: msg
    ads: false
    meta: {
      title: 'Page Not Found - 404 Error'
      forceTitle: true
    }
  })

#
# Top header links
#
topnav = {
  courses: {
    url: '#'
    meta: { title: 'Browse all AP study notes' }
    shortname: 'AP Courses'
  }

  astore: {
    url: '/study-guides'
    meta: { title: 'Buy Amazon.com AP Study Guides' }
    shortname: 'Book Store'
  }

  # add: {
  #   url: '/add/'
  #   meta: { title: 'Add Notes' }
  #   shortname: 'Add Notes'
  # }

  # login: {
  #   url: '/login/'
  #   meta: { title: 'Log In to StudyNotes' }
  #   shortname: 'Log In'
  # }
}

#
# Other routes without header links 
#
other = {

  home: {
    url: '/'
    shortname: ''
    hero: {
      title: 'Study Notes'
      # desc: 'Fast, free study tools for AP* students.'
      desc: 'The best AP* study guides.'
      # desc: 'Study tools for smart students.'
      # desc: 'The secret to getting a 5 on the AP* exam.'
    }
  }

  search: {
    url: '/search'
    handler: (req, res) ->
      q = req.query.q
      render(res, 'search', {
        meta: { title: 'Search Results for ' + q }
        search_term: q
      })
  }
    
  course: {
    url: '/:courseSlug'
    handler: (req, res) ->
      p = req.params
      course = m.cache.courses[p.courseSlug]

      if (!course)
        render404(res, "No course with slug #{ p.courseSlug }")
        return      

      render(res, 'course', {
        amazon: amazons[course.slug]
        breadcrumbs: []
        cls: "course #{course.slug}"
        course: course
        hero: {
          title: course.name
          desc: 'Online Prep and Review'
          mini: true
        }
        notetypes: course.notetypes
        meta: {
          url: course.absoluteUrl
          title: course.name
        }
      })


  }

  notetype: {
    url: '/:courseSlug/:notetypeSlug'
    handler: (req, res) ->
      p = req.params
      course = m.cache.courses[ p.courseSlug ]

      if (!course)
        render404(res, "No course with slug #{ p.courseSlug }")
        return

      notetype = u.find(course.notetypes, (n) ->
        n.slug == p.notetypeSlug
      )
      if (!notetype)
        render404(res, "Course has no notetype with slug #{ p.notetypeSlug }")
        return
      
      m.Note
      .find({ courseId: course._id, notetypeId: notetype._id })
      .sort('ordering')
      .exec((err, notes) ->
        if (err) then error(err); return

        if (!notes)
          render404( res, 'Unable to load notes' )
          return

        render(res, 'notetype', {
          amazon: amazons[course.slug]
          breadcrumbs: [
            { name: course.name, url: course.url }
          ]
          course: course
          notetype: notetype
          notes: notes
          meta: {
            url: notetype.absoluteUrl
            title: course.name + ' ' + notetype.name
          }
        })


      )
  }

  note: {
    url: '/:courseSlug/:notetypeSlug/:noteSlug'
    handler: (req, res) ->
      p = req.params
      course = m.cache.courses[p.courseSlug]

      if (!course)
        render404(res, "No course with slug #{ p.courseSlug }")
        return

      notetype = u.find(course.notetypes, (n) ->
        n.slug == p.notetypeSlug
      )
      if (!notetype)
        render404(res, 'Course has no notetype with slug ' + p.notetypeSlug)
        return
           
      m.Note
      .find({ courseId: course._id, notetypeId: notetype._id })
      .sort('ordering')
      .exec((err, notes) ->
        if (err) then error(err); return

        if (!notes)
          render404(res, 'Unable to load notes')
          return

        note = u.find(notes, (n) ->
          n.slug == p.noteSlug
        )

        if (!note)
          render404(res, 'Course+notetype have no note with slug ' + p.noteSlug)
          return

        noteOrdering = note.ordering

        noteNext = u.find(notes, (note) ->
          note.ordering == noteOrdering + 1
        )

        notePrev = u.find(notes, (note) ->
          note.ordering == noteOrdering - 1
        )

        note.update({ $inc: { hits: 1 } }, { upsert: true }, () ->)

        render(res, 'note', {
          amazon: amazons[course.slug]
          breadcrumbs: [
            { name: course.name, url: course.url }
            { name: notetype.name, url: notetype.url }
          ],
          course: course
          notetype: notetype
          note: note
          noteNext: noteNext
          notePrev: notePrev
          relatedNotes: notes
          meta: {
            url: note.absoluteUrl
            title: util.titleify(note.name, course.name + ' ' + notetype.name)
          }
        })


      )
  }

  notFound: {
    url: '*'
    handler: (req, res) ->
      render404(res)
  }

}

#
# Initialize and register the app's routes
#
routes = u.extend({}, topnav, other)

u.each(routes, (locals, templateName) ->
  if (locals.url == '#')
    return

  app.get(locals.url, (req, res) ->

    # If locals.meta is missing `url`, try to add it  
    if ((!locals.meta || !locals.meta.url) && locals.url.indexOf(':') == -1 && locals.url.indexOf('*') == -1)
      locals.meta = locals.meta || {}
      absoluteUrl = config.siteUrl + locals.url
      if (absoluteUrl[absoluteUrl.length - 1] != '/')
        absoluteUrl += '/'

      locals.meta.url = absoluteUrl

    if (locals.handler)
      locals.handler(req, res)
    else
      render(res, templateName, locals) 
  )
)
