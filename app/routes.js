var async = require('async');


var topnav = {
  index: {
    url: '/', 
    title: 'StudyNotes.org - Study better with Free AP Course Notes',
    forceTitle: true,
    shortname: '',
  },

  add: {
    url: '/add',
    title: 'Add Notes',
    shortname: 'Add Notes',
  },

  astore: {
    url: '/study-guides',
    title: 'Buy Amazon.com AP Study Guides',
    shortname: 'Bookstore',
  }
};

var other = {
  notfound: {
    url: '*',
    handler: function (req, res) {
      render404(res);
    }
  }
};

var courses = undefined;
async.waterfall([
  function (cb) {
    m.Course.find(cb);
  },
  function (courses, cb) {
    courses = courses;

    
  }
]);



/*
 * Render a template.
 *
 * Adds variables that all templates will expect. We use this function so we
 * have one location to add all these variables.
 *
 * Use this function instead of calling res.render() directly. 
 */
function render(res, templateName, locals) {
  res.render(templateName, _.extend(locals, {
    cls: templateName,
    topnav: topnav,
    config: config
  }));
}

// Render 404 page, and log error message
function render404(res, err) {
  if (err)
    console.log(err);

  res.status(404);
  render(res, 'notfound', {
    title: 'Page Not Found - 404 Error',
    forceTitle: true,
    err: err
  });
};

// Initializes and registers the app's routes
exports.init = function (app) {
  var routes = _.extend({}, topnav, other);

  // TODO
  app.get('/ap-notes/:courseSlug/:noteTypeSlug/:noteSlug', routes.note);

  _.each(routes, function (locals, templateName) {
    app.get(locals.url, function(req, res) {
      if (locals.handler) {
        locals.handler(req, res);
      } else {
        render(res, templateName, locals);
      }
    });
  });
};

// TODO
exports.note = function (req, res) {
  var courseSlug = req.params.courseSlug
  , noteSlug = req.params.noteSlug
  , noteTypeSlug = req.params.noteTypeSlug;

  Course.find({
    where: {
      slug: courseSlug
    }
  }).done(function (err, course) {
    NoteType.find({
      where: {
        slug: noteTypeSlug
      }
    }).done(function (err, noteType) {
      
      if (err) {
        console.error(err);
      }
      
      if (!course || !noteType) {
        render404(res, 'No course or note type with that slug');
        return;
      }
      
      if (!course.hasNoteType(noteType)) {
        render404(res, 'Course does not have this note type');
        return;
      }
      
      Note.find({
        where: {
          slug: noteSlug,
          CourseId: course.id,
          NoteTypeId: noteType.id
        }
      }).done(function (err, note) {
        
        if (err) {
          console.error(err);
        }
        
        if (!note) {
          render404(res, 'No note with that slug');
          return;
        }
        
        render(res, 'note', {
          title: "" + note.name + " - " + course.name + " - " + noteType.name
        });
      });
    });
  });
};
