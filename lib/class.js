
exports.class = {
  create: function() {
    var self = Object.create(this);
    self._events = {};
    self.init.apply(self, arguments);
    return self;
  },


  on: function(type, func, extra) {
    (this._events[type] = this._events[type] || []).push([func, extra]);
  },

  off: function(type, func) {
    var list = this._events[type] || [];
    for(var i=0; i<list.length; i++) {
      if(func == list[i][0])
        list.splice(i, 1);
    }
  },

  emit: function(type, data) {
    var list = this._events[type] || [];
    for(var i=list.length-1; i>=0; i--) {
      list[i][0](data, list[i][1]);
    }
  },

  extend: function(extension) {
    var hasOwnProperty = Object.hasOwnProperty;
    var object = Object.create(this);

    for(var property in extension)
      if(hasOwnProperty.call(extension, property) || typeof object[property] === 'undefined')
        object[property] = extension[property];

    object._super = this;

    return object;
  }
};
