var topnav = {
  browse: {
    url: '#',
    title: 'Browse all AP study notes',
    shortname: 'Courses',
  },

  astore: {
    url: '/study-guides',
    title: 'Buy Amazon.com AP Study Guides',
    shortname: 'Book Store',
  },

  add: {
    url: '/add',
    title: 'Add Notes',
    shortname: 'Add Notes',
  },

  login: {
    url: '/login',
    title: 'Log In to StudyNotes',
    shortname: 'Log In',
  },
};

var other = {
  home: {
    url: '/', 
    title: 'StudyNotes.org - Study better with Free AP Course Notes',
    forceTitle: true,
    shortname: '',
  },
  notetype: {
    url: '/ap-notes/:courseSlug/:notetypeSlug',
    handler: function (req, res) {
      var p = req.params;

      m.Course
      .findOne({ slug: p.courseSlug })
      .populate('notetypes')
      .exec(function (err, course) {
        if (err) {
          console.log(err);
          return;
        }

        if (!course) {
          render404(res, 'No course with that slug');
          return;
        }

        var notetype = u.where(course.notetypes, { slug: p.notetypeSlug });
        console.log(notetype);
        if (!notetype.length) {
          render404(res, 'Course has no notetype with that slug');
          return;
        }
        notetype = notetype[0];
        
        render(res, 'notetype', {
          title: notetype.name
        });

        // Note.find({
        //   where: {
        //     slug: noteSlug,
        //     CourseId: course.id,
        //     NoteTypeId: noteType.id
        //   }
        // }).done(function (err, note) {
          
        //   if (err) {
        //     console.error(err);
        //   }
          
        //   if (!note) {
        //     render404(res, 'No note with that slug');
        //     return;
        //   }
          
        //   render(res, 'note', {
        //     title: "" + note.name + " - " + course.name + " - " + noteType.name
        //   });
        // });
      
      });
    }
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
  notfound: {
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
    topnav: topnav,
    courses: m.cache.courses,
    search_term: '',
    config: config
  }, locals));
}

// Render 404 page, and log error message
function render404(res, err) {
  if (err) console.log(err);

  res.status(404);
  render(res, 'notfound', {
    title: 'Page Not Found - 404 Error',
    forceTitle: true,
    err: err
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
