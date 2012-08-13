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

exports.index = (req, res) ->
  res.render 'index',
    forceTitle: 'StudyNotes.org - Study better with Free AP Course Notes'

exports.note = (req, res) ->
  {courseSlug, noteTypeSlug, noteSlug} = req.params

  course = _.find COURSES, (c) ->
    c.slug == courseSlug 

  noteType = _.find NOTE_TYPES, (n) ->
    n.slug == noteTypeSlug

  # if not course or not noteType
  #   res.send 404, res.render 'index', title: '404 Not Found'

  # conn.query

  res.render 'note',
    title: "#{noteSlug} - #{courseSlug} - #{noteTypeSlug}"

exports.notfound = (req, res) ->
  res.render 'notfound'