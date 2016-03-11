
var c = require('./class').class;
var merge = require('merge');

// Hardcoded list of languages. Sorry.

/* Also, multiline comments aren't supported yet.  No, really, they're
 * not.  Seriously. Totally not. This text here _totally_ isn't from a
 * multiline comment.
 */

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
  
  'Markdown': {
    name: {
      hljs: null
    },
    single: [
    ],
    multi: [
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
    
    this.single = [];
    
    this.multi = [];

    var languages = merge(exports.languages, project.options.languages);

    if(language in languages) {
      var l = languages[language];
      
      this.name = l.name;
      this.single = l.single;
      this.multi = l.multi;
      
    } else {
      throw 'no such language "' + language + '"';
    }
    
  },

  is_single_comment: function(line) {
    
    // Why add the space? Because we still want the empty comments to
    // separate paragraphs in Markdown. Adding a space to the end of
    // the comment is a bit of a weird way to do it, but it's fast and
    // works well.
    
    line = line.trim() + ' ';
    
    for(var i=0; i<this.single.length; i++) {
      if(line.startsWith(this.single[i] + ' ')) return true;
    }
    
    return false;
  },

  is_multi_comment: function(line) {
    
    line = line.trim();
    
    for(var i=0; i<this.multi.length; i++) {
      if(line.startsWith(this.multi[i][0])) return true;
      if(line.endsWith(this.multi[i][2])) return true;
    }
    
    return false;
  },

  is_in_multi_comment: function(line) {
    
    line = line.trim();
    
    for(var i=0; i<this.multi.length; i++) {
      if(line.startsWith(this.multi[i][0])) return true;
      if(line.startsWith(this.multi[i][1])) return true;
      if(line.endsWith(this.multi[i][2])) return true;
    }
    
    return false;
  },

  strip_single_comment: function(line) {
    
    // Given a comment, returns the contents of it.
    
    line = line.trim();
    var c;
    
    for(var i=0; i<this.single.length; i++) {
      c = this.single[i];
      
      if(line.startsWith(c)) {
        return line.substr(c.length).trim();
      }
      
    }
    
    return line;
  },

  strip_multi_comment_end: function(line, end) {
    line = line.trim();

    if(line.endsWith(end)) {
      return line.substr(0, line.length - end.length).trim();
    }
    return line;
  },
      
  strip_multi_comment: function(line) {
    
    line = line.trim();
    var s, m, e;
    
    for(var i=0; i<this.multi.length; i++) {
      s = this.multi[i][0];
      m = this.multi[i][1];
      e = this.multi[i][2];

      if(line.startsWith(s)) {
        line = line.substr(m.length);
        
        if(line.startsWith(m))
          line = line.substr(m.length).trim();
        
        return this.strip_multi_comment_end(line, e);
      } else if(line.endsWith(e)) {
        return this.strip_multi_comment_end(line, e);
      } else if(line.startsWith(m)) {
        return this.strip_multi_comment_end(line.substr(m.length), e);
      } else {
        continue;
      }
        
    }
    
    return line;
  },

  is_comment: function(line) {
    return this.is_single_comment(line) || this.is_multi_comment(line);
  },

  strip_comment: function(line) {
    
    // See `strip_single_comment`.
    if(this.is_single_comment(line))
      return this.strip_single_comment(line);
    else
      return this.strip_multi_comment(line);
    return line;
  }

});
