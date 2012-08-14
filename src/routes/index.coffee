NOTE_TYPES = {
  VOCAB: {
    id: 1
    name: 'Vocabulary Terms'
    slug: 'vocabulary'
  }
  CHAPTER_OUTLINE: {
    id: 2
    name: 'Chapter Outlines'
    slug: 'chapter-outlines'
  }
}

COURSES = {
  US_HISTORY: {
    id: 1
    name: 'AP US History'
    slug: 'ap-us-history'
    ntypes: [
      NOTE_TYPES.VOCAB,
      NOTE_TYPES.CHAPTER_OUTLINE
    ]
  },
}

not_found = (res) ->
  res.status(404).render('index', title: 'Page Not Found - 404 Error')

exports.index = (req, res) ->
  res.render 'index',
    forceTitle: 'StudyNotes.org - Study better with Free AP Course Notes'

exports.note = (req, res) ->
  {courseSlug, noteTypeSlug, noteSlug} = req.params

  course = _.find COURSES, (c) ->
    c.slug == courseSlug 

  noteType = _.find NOTE_TYPES, (n) ->
    n.slug == noteTypeSlug

  if not course or not noteType
    not_found(res)

  # conn.query

  res.render 'note',
    title: "#{noteSlug} - #{courseSlug} - #{noteTypeSlug}"

exports.not_found = (req, res) ->
  not_found(res)