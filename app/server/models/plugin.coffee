exports.modifyDate = (schema, options) ->
  schema.add({ modifyDate: Date })
  
  schema.pre('save', (next) ->
    this.modifyDate = new Date
    next()
  )
  
  if (options && options.index)
    schema.path('modifyDate').index(options.index)


exports.createDate = (schema, options) ->
  schema.add({ createDate: Date })
  
  schema.pre('save', (next) ->
    if (!this.createDate)
      this.createDate = new Date
    
    next()
  )
  
  if (options && options.index)
    schema.path('createDate').index(options.index)


exports.hits = (schema, options) ->
  schema.add({ hits: Number })

  if (options && options.index)
    schema.path('hits').index(options.index)

