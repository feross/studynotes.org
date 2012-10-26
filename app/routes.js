var model = require('./../model')
  , Course = model.Course
  , NoteType = model.NoteType
  , Note = model.Note;

// Render 404 page, and log error message
renderNotFound = function(res, err) {
  console.log(err);
  res.status(404).render('not-found', {
    forceTitle: 'Page Not Found - 404 Error'
  });
};

exports.index = function(req, res) {
  res.render('index', {
    forceTitle: 'StudyNotes.org - Study better with Free AP Course Notes'
  });
};

exports.astore = function(req, res) {
  res.render('astore', {
    title: 'Buy AP Study Guides'
  });
};

exports.note = function(req, res) {
  var courseSlug = req.params.courseSlug
  , noteSlug = req.params.noteSlug
  , noteTypeSlug = req.params.noteTypeSlug;

  Course.find({
    where: {
      slug: courseSlug
    }
  }).done(function(err, course) {
    NoteType.find({
      where: {
        slug: noteTypeSlug
      }
    }).done(function(err, noteType) {
      
      if (err) {
        console.error(err);
      }
      
      if (!course || !noteType) {
        renderNotFound(res, 'No course or note type with that slug');
        return;
      }
      
      if (!course.hasNoteType(noteType)) {
        renderNotFound(res, 'Course does not have this note type');
        return;
      }
      
      Note.find({
        where: {
          slug: noteSlug,
          CourseId: course.id,
          NoteTypeId: noteType.id
        }
      }).done(function(err, note) {
        
        if (err) {
          console.error(err);
        }
        
        if (!note) {
          renderNotFound(res, 'No note with that slug');
          return;
        }
        
        res.render('note', {
          title: "" + note.name + " - " + course.name + " - " + noteType.name
        });
      });
    });
  });
};

exports.notFound = function(req, res) {
  renderNotFound(res, 'msg');
};
