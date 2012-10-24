{Course, NoteType, Note} = require './../model'

# Render 404 page, and log error message
renderNotFound = (res, err) ->
  console.log err
  res.status(404).render('notfound', title: 'Page Not Found - 404 Error')

exports.index = (req, res) ->
  res.render 'index',
    forceTitle: 'StudyNotes.org - Study better with Free AP Course Notes'

exports.note = (req, res) ->
  {courseSlug, noteTypeSlug, noteSlug} = req.params

  Course.find(where: {slug: courseSlug})
  .done (err, course) ->
    NoteType.find(where: {slug: noteTypeSlug})
    .done (err, noteType) ->
      console.error err if err

      if !course or !noteType
        renderNotFound res, 'No course or note type with that slug'
        return

      if !course.hasNoteType(noteType)
        renderNotFound res, 'Course does not have this note type' 
        return

      Note.find(
        where:
          slug: noteSlug
          CourseId: course.id
          NoteTypeId: noteType.id  
      ).done (err, note) ->
        console.error err if err

        if not note
          renderNotFound res, 'No note with that slug'
          return

        res.render 'note',
          title: "#{note.name} - #{course.name} - #{noteType.name}"

exports.notFound = (req, res) ->
  renderNotFound(res, '')