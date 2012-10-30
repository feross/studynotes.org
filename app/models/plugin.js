exports.modifyDate = function (schema, options) {
  schema.add({ modifyDate: Date });
  
  schema.pre('save', function (next) {
    this.modifyDate = new Date;
    next();
  });
  
  if (options && options.index) {
    schema.path('modifyDate').index(options.index);
  }
}

exports.createDate = function (schema, options) {
  schema.add({ createDate: Date });
  
  schema.pre('save', function (next) {
    if (!this.createDate) {
      this.createDate = new Date;
    }
    next();
  });
  
  if (options && options.index) {
    schema.path('createDate').index(options.index);
  }
}

