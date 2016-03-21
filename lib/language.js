
var path = require('path');
var merge = require('merge');
var c = require('./class').class;

// Include the list of languages.
var languages_list = require('./languages');

// colors
var colors = require('./github-colors');

exports.normalize_language = function(l, name) {
  l.color = colors[(l.name.color || l.name.hljs || name).toLowerCase()] || '#000';
  if(!('abbr' in l.name)) l.name.abbr = l.extensions[0];
  return l;
};

exports.get_language = function(extension, extra_languages) {
  var languages = merge(languages_list, extra_languages || {}),
      i;

  for(i in languages) {
    if(!('extensions' in languages[i])) continue;
    
    if(languages[i].extensions.indexOf(extension) >= 0) {
      return [exports.normalize_language(languages[i], i), i];
    }
  }
  
  return [
    {
      'name': { hljs: 'auto', human: 'Autodetected (Unknown)', abbr: 'AUTO' },
      color: '#000',
      'extensions': []
    },
    'auto'
  ];
};

exports.language = c.extend({
  
  init: function(project, file) {
    this.name = {};
    
    this.single = [];
    
    this.multi = [];

    var language = exports.get_language(path.extname(file.filename).substr(1), project.options.languages);
    var language_name = language[1];
    language = language[0];

    if(language_name != 'auto') {
      this.name = language.name;

      if(!('human' in this.name)) this.name.human = language_name;
      
      if('single' in language) this.single = language.single;
      if('multi' in language)  this.multi = language.multi;

      // If we haven't found the language, send off an event with the filename.
    } else {
      project.emit('language-not-found', { filename: file.filename });

      // Then, tell HLJS (in [section.js](:section.js) to autodetect the language.

      this.name = {
        hljs: 'auto',
        human: 'Autodetected (Unknown)',
        abbr: 'AUTO'
      };

      // Set up some sane defaults for comments. These won't cover
      // tons of languages, but it's better to have at least some
      // comments extracted, even if the language is unknown.

      this.single = [
        '//',
        ';',
        '--',
        '#'
      ];

      this.multi = [
        ['/*', '*', '*/']
      ];

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
      if(line.startsWith(this.multi[i][0] + ' ')) return true;
    }
    
    return false;
  },

  is_in_multi_comment: function(line) {
    
    line = line.trim();
    
    for(var i=0; i<this.multi.length; i++) {
      if(line.startsWith(this.multi[i][0] + ' ')) return true;
      if(line.startsWith(this.multi[i][1])) return true;
      if(line.endsWith(this.multi[i][2])) return true;
    }
    
    return false;
  },

  ends_multi_comment: function(line) {
    
    line = line.trim();
    
    for(var i=0; i<this.multi.length; i++) {
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
      s = this.multi[i][0] + ' ';
      m = this.multi[i][1];
      e = this.multi[i][2];

      if(line.startsWith(s)) {
        line = line.substr(s.length);
        
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
