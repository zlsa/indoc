
var path = require('path');
var merge = require('merge');
var c = require('./class').class;

// Include the list of languages.
var languages_list = require('./languages');

// colors
var colors = require('./github-colors');

exports.normalize_language = function(l, name) {
  l.color = colors[(l.name.color || l.name.hljs || l.name.abbr || name).toLowerCase()] || 'transparent';
  if(!('abbr' in l.name)) l.name.abbr = l.extensions[0];
  return l;
};

exports.get_language = function(extension, extra_languages) {
  
  var languages = languages_list, i;

  // If there are extra language or language parameters passed in, we
  // need to merge the two.

  if(extra_languages) {
    for(i in extra_languages) {
      languages[i] = merge(languages[i], extra_languages[i]);
    }
  }
  
  for(i in languages) {
    
    // If the language isn't in our DB, continue.
    if(!('extensions' in languages[i])) continue;

    if(languages[i].extensions.indexOf(extension) >= 0) {
      return [exports.normalize_language(languages[i], i), i];
    }
  }
  
  return [
    {
      name: { hljs: 'auto', human: 'Autodetected (Unknown)', abbr: 'AUTO' },
      color: '#000',
      extensions: []
    },
    'auto'
  ];
};

class Language {
  
  constructor(project, file) {
    this.name = {};
    
    this.single = [];
    
    this.multi = [];

    // Contains a list of strings; if any of these strings is at the
    // start of a comment, the comment will be ignored (and stay in
    // the file section).
    
    this.ignore = [];

    var language = exports.get_language(path.extname(file.filename).substr(1), project.options.languages);
    var language_name = language[1];
    
    language = language[0];

    if(language_name != 'auto') {
      this.name = language.name;

      if(!('human' in this.name)) this.name.human = language_name;
      
      if('single' in language) this.single = language.single;
      if('multi' in language)  this.multi = language.multi;
      if('ignore' in language) this.ignore = language.ignore;

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
    
  }

  should_ignore_comment(comment) {
    comment = comment.trim();

    for(var i=this.ignore.length-1; i>=0; i--) {
      if(comment.startsWith(this.ignore[i])) {
        return true;
      }
    }

    return false;
    
  }

  is_single_comment(line) {
    
    // Why add the space? Because we still want the empty comments to
    // separate paragraphs in Markdown. Adding a space to the end of
    // the comment is a bit of a weird way to do it, but it's fast and
    // works well.
    
    line = line.trim() + ' ';

    for(var i=this.single.length-1; i>=0; i--) {
      if(line.startsWith(this.single[i] + ' ')) {
        return !this.should_ignore_comment(this.strip_single_comment(line));
      }
    }
    
    return false;
  }

  starts_multi_comment(line) {
    
    line = line.trim();

    for(var i=this.multi.length-1; i>=0; i--) {
      if(line.startsWith(this.multi[i][0]) || line == this.multi[i][0]) return true;
    }

    return false;
  }

  ends_multi_comment(line) {
    
    line = line.trim();
    
    for(var i=this.multi.length-1; i>=0; i--) {
      if(line.endsWith(this.multi[i][2])) return true;
    }
    
    return false;
  }

  strip_single_comment(line) {
    
    // Given a comment, returns the contents of it.
    
    line = line.trim();
    var c;
    
    for(var i=this.single.length-1; i>=0; i--) {
      c = this.single[i];
      
      if(line.startsWith(c)) {
        return line.substr(c.length).trimRight().substr(1);
      }
      
    }
    
    return line;
  }

  strip_multi_comment_end(line, end) {
    line = line.trim();

    if(line.endsWith(end)) {
      return line.substr(0, line.length - end.length).trimRight();
    }
    
    return line;
  }
  
  strip_multi_comment(line) {
    
    line = line.trim();
    var s, m, e;

    // For each multi-line expression:
    
    for(var i=this.multi.length-1; i>=0; i--) {
      // "start", "middle", and "end" identifiers
      
      s = this.multi[i][0];
      m = this.multi[i][1];
      e = this.multi[i][2];

      // Check if this is the *start* of a multi-line comment.
        
      if(line.startsWith(s)) {
        line = line.substr(s.length);

        if(line.startsWith(m)) {
          line = line.substr(m.length).trimRight();

          if(/\s/.test(line[0]) && !/\s/.test(line[1])) {
            line = line.substr(1);
          }
          
        }

        return this.strip_multi_comment_end(line, e);
        
        // Check if this is the end of a multi-line comment.
        
      } else if(line.endsWith(e)) {
        return this.strip_multi_comment_end(line, e);

        // Check if this is the middle of a multi-line comment
      } else if(m && line.startsWith(m)) {

        return this.strip_multi_comment_end(line.substr(m.length), e);
      } else {
        continue;
      }
      
    }
    
    return line;
  }

  is_comment(line) {
    return this.is_single_comment(line) || this.starts_multi_comment(line);
  }

  strip_comment(line) {
    
    // See `strip_single_comment`.
    if(this.is_single_comment(line))
      return this.strip_single_comment(line);
    else
      return this.strip_multi_comment(line);
    return line;
  }

}

exports.Language = Language;
