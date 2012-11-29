var topnav = {
  browse: {
    url: '#',
    title: 'Browse all AP study notes',
    shortname: 'AP Courses',
  },

  astore: {
    url: '/study-guides/',
    title: 'Buy Amazon.com AP Study Guides',
    shortname: 'Book Store',
  },

  // add: {
  //   url: '/add/',
  //   title: 'Add Notes',
  //   shortname: 'Add Notes',
  // },

  // login: {
  //   url: '/login/',
  //   title: 'Log In to StudyNotes',
  //   shortname: 'Log In',
  // },
};

var other = {
  home: {
    url: '/', 
    title: 'StudyNotes.org - Study better with Free AP Course Notes',
    forceTitle: true,
    shortname: ''
  },
  search: {
    url: '/search',
    handler: function(req, res) {
      var q = req.query.q;
      render(res, 'search', {
        title: 'Search Results for ' + q,
        search_term: q
      })
    }
  },
  course: {
    url: '/:courseSlug',
    handler: function (req, res) {
      var p = req.params;

      var course = m.cache.courses[p.courseSlug];

      if (!course) {
        render404(res, 'No course with that slug');
        return;
      }

      render(res, 'course', {
        breadcrumbs: [],
        course: course,
        notetypes: course.notetypes,
        title: course.name
      });
    }
  },
  notetype: {
    url: '/:courseSlug/:notetypeSlug',
    handler: function (req, res) {
      var p = req.params;

      var course = m.cache.courses[p.courseSlug];

      if (!course) {
        render404(res, 'No course with that slug');
        return;
      }

      var notetype = u.where(course.notetypes, { slug: p.notetypeSlug });
      if (!notetype.length) {
        render404(res, 'Course has no notetype with that slug');
        return;
      }
      notetype = notetype[0];
      
      m.Note
      .find( { courseId: course._id, notetypeId: notetype._id } )
      .sort( 'ordering' )
      .exec( function ( err, notes ) {
        if (err) { error(err); return; }

        if ( !notes ) {
          render404( res, 'Unable to load notes' );
          return;
        } 

        render(res, 'notetype', {
          breadcrumbs: [
            { name: course.name, url: '/' + course.slug + '/' },
          ],
          course: course,
          notetype: notetype,
          notes: notes,
          title: notetype.name
        });

      });
    }
  },
  note: {
    url: '/:courseSlug/:notetypeSlug/:noteSlug',
    handler: function (req, res) {
      var p = req.params;

      var course = m.cache.courses[p.courseSlug];

      if (!course) {
        render404(res, 'No course with that slug');
        return;
      }

      var notetype = u.where(course.notetypes, { slug: p.notetypeSlug });
      if (!notetype.length) {
        render404(res, 'Course has no notetype with that slug');
        return;
      }
      notetype = notetype[0];
     
      m.Note
      .find( { courseId: course._id, notetypeId: notetype._id } )
      .sort( 'ordering' )
      .exec( function ( err, notes ) {
        if (err) { error(err); return; }

        if ( !notes ) {
          render404( res, 'Unable to load notes' );
          return;
        }

        var note = u.find(notes, function (note) {
          return note.slug == p.noteSlug;
        } );

        var noteOrdering = note.ordering;

        var noteNext = u.find(notes, function (note) {
          return note.ordering == noteOrdering + 1;
        } );

        var notePrev = u.find(notes, function (note) {
          return note.ordering == noteOrdering - 1;
        } );

        render(res, 'note', {
          breadcrumbs: [
            { name: course.name, url: '/' + course.slug + '/' },
            { name: notetype.name, url: '/' + course.slug + '/' + notetype.slug + '/' },
          ],
          course: course,
          notetype: notetype,
          note: note,
          noteNext: noteNext,
          notePrev: notePrev,
          relatedNotes: notes,
          title: note.name
        });
      });
    }
  },
  notFound: {
    url: '*',
    handler: function (req, res) {
      render404(res);
    }
  }
};


/*
 * Render a template.
 *
 * Adds variables that all templates will expect. We use this function so we
 * have one location to add all these variables. We also allow caller to
 * override the default values specified here by simply declaring them in the
 * object they pass as `locals`.
 *
 * Use this function instead of calling res.render() directly. 
 */
function render(res, templateName, locals) {
  res.render(templateName, u.extend({
    cls: templateName,
    config: config,
    courses: m.cache.courses,
    search_term: '',
    topnav: topnav
  }, locals));
}

// Render 404 page, and log error message
function render404(res, msg) {
  if (msg) { error(msg); } // don't return since we want to serve a 404 page
  
  res.status(404);
  render(res, 'notfound', {
    err: msg
    forceTitle: true,
    noAds: true,
    title: 'Page Not Found - 404 Error',
  });
};

// Initialize and registers the app's routes
var routes = u.extend({}, topnav, other);

u.each(routes, function (locals, templateName) {
  if (locals.url == '#') {
    return;
  }
  app.get(locals.url, function(req, res) {
    if (locals.handler) {
      locals.handler(req, res);
    } else {
      render(res, templateName, locals);
    }
  });
});
