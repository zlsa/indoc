
var fs = require('fs-extra');
var path = require('path');
var merge = require('merge');

var c = require('./class').class;
var auto = require('run-auto');
var section = require('./section').section;
var language = require('./language').language;

exports.file = c.extend({

  // The file needs access to the `project` for options and the
  // templates.
  
  init: function(project, filename) {
    this.project = project;
    
    this.filename = filename;

    // See [section.js](:)
    this.sections = [];

    this.html = '';

    this.index = false;
  },

  // Does nothing at the moment.

  preprocess_file: function(data, callback) {
    callback(null, data);
  },

  // Split up the input by newlines and call the callback.

  split_lines: function(data, callback) {
    var lines = data.split(/\r?\n/);

    callback(null, lines);
  },

  // Detect the programming language. (Currently, only uses the file
  // extension.)
  
  detect_language: function(data, callback) {
    var scope = this;
    
    this.language = language.create(scope.project, scope);
    callback(null, this.language);
    
  },

  // The meat of the program: parsing lines.

  parse_lines: function(data, lang, callback) {

    // See [section.js](:section.js).
    var sections = [];

    var scope = this;
    
    function add_section() {
      
      // We don't want to create a new section if the current one is empty anyway.
      
      if(sections.length == 0 || !current_section().is_empty()) {
        sections.push(section.create(scope.project, scope, lang));
      }
      
    }

    // Start off with an empty section.

    add_section();

    // Just a convenience function.
    
    function current_section() {
      return sections[sections.length-1];
    }

    // `in_comment` is self explanatory. That's why I'm explaining it
    // to you right now by saying it's self explanatory. Hey, if I was
    // smart, I'd be working at [SpaceX](http://www.spacex.com/). Or
    // something.
    
    var in_comment = false,
        in_multi = false,
        line,
        comment,
        i;

    // `for(line in data) { ...`

    for(i=0; i<data.length; i++) {
      line = data[i];

      // ... if that line is a comment...
      if(lang.is_comment(line) || (in_multi && lang.is_in_multi_comment(line))) {

        if(lang.is_multi_comment(line) && !lang.ends_multi_comment(line))
          in_multi = true;
        else if(lang.ends_multi_comment(line))
          in_multi = false;

        // ... then strip the whitespace from it...
        comment = lang.strip_comment(line);

        // ... and add a new section, if necessary.
        if(!in_comment)
          add_section();

        // Then append the line to the current section's comment, with
        // a newline (to replace the one lost with the split, above.)
        current_section().comment += comment + '\n';

        // We're obviously in a comment now.
        in_comment = true;
        
      } else {
        
        in_comment = false;
        in_multi = false;

        // This is a bit strange: if we're currently on our first
        // section, _and_ the code is empty, _and_ the line is empty,
        // then ignore it.  Basically, this chops off the whitespace
        // at the start of a file.
        if(sections.length == 1 && !current_section().code.trim() && !line.trim()) continue;

        // If there's a space after the comment, we want to ignore
        // it. (Otherwise, the tops of the code and the comments won't
        // be lined up and it'll be harder to match them up.)
        if(!current_section().code.trim() && !line.trim()) continue;

        // Same as above: we need to replace the missing newline.
        current_section().code += line + '\n';
      }
      
    };

    // This just syntax-highlights the code and converts the Markdown
    // comments to HTML.
    for(i=0; i<sections.length; i++) {
      sections[i].done();
    }

    this.sections = sections;

    // And we're done here! Whew.
    callback(null, sections);
    
  },

  get_rel_path: function(index) {
    var rel_path = './' + path.relative('/' + this.get_link(), '/');
    if(index) rel_path = '.';
    return rel_path;
  },

  get_rel_link: function(link) {
    return path.relative(this.get_rel_path(), link);
  },

  // This function just invokes Handlebars to produce the HTML output.
  generate_output: function(sections, language, index, callback) {

    if(!callback) {
      callback = index;
      index = undefined;
    }

    if(index == undefined) index = false;

    this.index = index;

    if(!sections) sections = this.sections;
    if(!language) language = this.language;

    for(i=0; i<sections.length; i++) {
      sections[i].done();
    }

    var i;

    // Relative path to the output root, in filesystem-space.  For the
    // file `docs/foo/bar/`, `rel_path` would be `./../../`. It's used
    // for inter-file linking and CSS/JS.
    var rel_path = this.get_rel_path(index);

    // Get a list of all of the other files' filenames and URLs except
    // this one.
    var filenames = this.project.get_link_filenames(this);

    if(index) filenames = this.project.get_link_filenames();

    var md = null;

    if(sections.length == 1 && sections[0].code_is_markdown) {
      md = sections[0].code_highlighted;
    }

    var classes = [];

    if(index) classes.push('index');
    else      classes.push('code');
    
    if(md) classes.push('markdown');

    // HANDLEBARS, DO YOUR THING!
    var page = this.project.templates.page(merge(this.project.default_template_data, {
      title: (index ? this.project.options.name : this.filename),
      version: this.project.options.version,
      language: this.language.name.human,
      markdown: md,
      filename: this.filename,
      files: filenames,
      path: rel_path,
      index: index,
      classes: classes.join(' '),
      sections: sections
    }));
    
    callback(null, page);
  },

  // Get the output filename, in filesystem-space. For `bin/main.js`,
  // this returns `docs/bin/main.js/index.html`
  get_output_filename: function() {
    return path.join(this.project.options.output, this.filename, 'index.html');
  },

  // Same as above, but server-space. With `bin/main.js`, this returns
  // `bin/main.js/`. It's used for pretty links in `<a>` tags.
  get_link: function() {
    if(this.index) return '/';
    return this.filename + '/';
  },

  // Write the generated file.
  write: function(output, filename, callback) {

    if(!output) {
      output = this.html;
    }

    if(!callback) {
      callback = filename;
      filename = this.get_output_filename();
    }

    var scope = this;

    fs.mkdirs(path.dirname(filename), function (err) {
      if(err) {
        callback(err, null);
        return;
      }

      // Yeah, yeah, I know, callback hell. What's the harm in using it once?
      
      fs.writeFile(filename, output, function(err) {
        
        if(err) {
          callback(err, null);
          return;
        }

        callback(null, null);

      });      
      
    });


  },

  // A mega-function that calls most of the above functions, in the
  // proper order thanks to `run-auto`.
  
  parse_file: function(err, data, callback) {

    var scope = this;

    // This is weird. I'm not sure why it's here instead of up there,
    // but I'm sure there's some reason. I don't change strange things
    // like this when I find them for fear of causing my programs to
    // explode with errors.
    
    if(err) {
      callback(err, this);
      return;
    }

    // See above: `var auto = require('run-auto');`

    auto({
      
      preprocess: function(next) {
        scope.preprocess_file.call(scope, data, function(err, data) {

          next(err, data);
          
        });
      },
      
      split_lines: ['preprocess', function(next, results) {
        
        scope.split_lines.call(scope, results.preprocess, function(err, data) {
          
          next(err, data);
          
        });
          
      }],
      
      language: ['preprocess', function(next, results) {
        
        scope.detect_language.call(scope, results.preprocess, function(err, data) {
          
          next(err, data);
          
        });
          
      }],
      
      parse_lines: ['split_lines', 'language', function(next, results) {

        scope.parse_lines.call(scope, results.split_lines, results.language, function(err, data) {
          
          next(err, data);
          
        });
          
      }],
      
      generate: ['parse_lines', 'language', function(next, results) {
        
        scope.generate_output.call(scope, results.parse_lines, results.language, function(err, data) {

          scope.html = data;
          
          next(err, data);
          
        });
          
      }],
      
      write: ['generate', function(next, results) {
        
        scope.write.call(scope, results.generate, function(err, data) {

          next(err, data);
          
        });
          
      }]
      
    }, function(err, results) {
      callback(err, scope);
    });
    
  },

  parse: function(callback) {
    var scope = this;
    
    fs.readFile(this.filename, 'utf8', function(err, data) {
      scope.parse_file.call(scope, err, data, callback);
    });

  },

  // And call the above functions. (This is separate so I can split
  // out "parsing" and "running" in the near future, to allow
  // inter-file linking, etc.)
  
  run: function(callback) {
    this.parse(callback);
  }
  
});
