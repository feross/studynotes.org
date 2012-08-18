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

  await
    Course.find(where: {slug: courseSlug})
      .done defer err, course
    NoteType.find(where: {slug: noteTypeSlug})
      .done defer err, noteType

  console.error err if err

  if not course or not noteType
    renderNotFound res, 'No course or note type with that slug'
    return

  if not course.hasNoteType noteType
    renderNotFound res, 'Course does not have this note type' 
    return

  await
    Note.find(
      where:
        slug: noteSlug
        CourseId: course.id
        NoteTypeId: noteType.id  
    ).done defer err, note

  console.error err if err

  if not note
    renderNotFound res, 'No note with that slug'
    return

  res.render 'note',
    title: "#{note.name} - #{course.name} - #{noteType.name}"

exports.notFound = (req, res) ->
  renderNotFound(res, '')