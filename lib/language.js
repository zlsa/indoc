
var c = require('./class').class;

exports.languages = {
  'JavaScript': {
    name: {
      hljs: 'JavaScript'
    },
    single: [
      '//'
    ],
    multi: [
      ['/*', '*', '*/']
    ]
  },
  'SCSS': {
    name: {
      hljs: 'SCSS'
    },
    single: [
      '//'
    ],
    multi: [
      ['/*', '*', '*/']
    ]
  },
  'HTML': {
    name: {
      hljs: 'HTML'
    },
    single: [
    ],
    multi: [
      ['<!--', '', '-->']
    ]
  }
};

exports.language = c.extend({
  
  init: function(project, file, language) {
    this.name = {};
    
    this.single = [

    ];
    
    this.multi = [

    ];

    if(language in exports.languages) {
      var l = exports.languages[language];
      this.name = l.name;
      this.single = l.single;
      this.multi = l.multi;
    } else {
      throw 'no such language "' + language + '"';
    }
  },

  is_single_comment: function(line) {
    line = line.trim();
    
    for(var i=0; i<this.single.length; i++) {
      if(line.startsWith(this.single[i] + ' ')) return true;
    }
    
    return false;
  },

  strip_single_comment: function(line) {
    line = line.trim();
    var c;
    
    for(var i=0; i<this.single.length; i++) {
      c = this.single[i];
      
      if(line.startsWith(c)) {
        return line.substr(c.length).trim();
      }
      
    }
    return false;
  },

  is_comment: function(line) {
    return this.is_single_comment(line);
  },

  strip_comment: function(line) {
    if(this.is_single_comment(line))
      return this.strip_single_comment(line);
    return line;
  }

});
