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
    ads: true,
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
  render(res, 'notfound', {
    err: msg
    forceTitle: true
    ads: false
    title: 'Page Not Found - 404 Error'
  })

#
# Top header links
#
topnav = {
  courses: {
    url: '#'
    title: 'Browse all AP study notes'
    shortname: 'AP Courses'
  }

  astore: {
    url: '/study-guides/'
    title: 'Buy Amazon.com AP Study Guides'
    shortname: 'Book Store'
  }

  # add: {
  #   url: '/add/'
  #   title: 'Add Notes'
  #   shortname: 'Add Notes'
  # }

  # login: {
  #   url: '/login/'
  #   title: 'Log In to StudyNotes'
  #   shortname: 'Log In'
  # }
}

#
# Other routes without header links 
#
other = {

  home: {
    url: '/'
    title: 'StudyNotes.org - Study better with Free AP Course Notes'
    forceTitle: true
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
        title: 'Search Results for ' + q
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
        course: course
        hero: {
          title: course.name
          desc: 'Desc here.'
          mini: true
        }
        notetypes: course.notetypes
        title: course.name
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
          title: course.name + ' ' + notetype.name
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
            { name: notetype.name, url: '/' + course.slug + '/' + notetype.slug + '/' }
          ],
          course: course
          notetype: notetype
          note: note
          noteNext: noteNext
          notePrev: notePrev
          relatedNotes: notes
          title: util.titleify(note.name, course.name + ' ' + notetype.name)
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
    if (locals.handler)
      locals.handler(req, res)
    else
      render(res, templateName, locals) 
  )
)
