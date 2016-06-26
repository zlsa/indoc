'use strict';

const fs = require('fs-extra');
const path = require('path');
const merge = require('merge');

const auto = require('run-auto');
const section = require('./section').section;
const language = require('./language').language;

class File {

  // The file needs access to the `project` for options and the
  // templates.
  
  constructor(project, filename) {
    this.project = project;
    
    this.filename = filename;
    this.path = filename;

    this.index = false;

    // See [section.js](:)
    this.sections = [];

    // The final output HTML file.
    this.html = '';

    this.default_template_data = merge(this.project.default_template_data, {});
  }

  // Does nothing at the moment.

  preprocess_file(data, callback) {
    callback(null, data);
  }

  // Split up the input by newlines and call the callback.

  split_lines(data, callback) {
    var lines = data.split(/\r?\n/);

    callback(null, lines);
  }

  // Detect the programming language. (Currently, only uses the file
  // extension.)
  
  detect_language(data, callback) {
    var scope = this;
    
    this.language = language.create(scope.project, scope);
    callback(null, this.language);
  }

  // The meat of the program: parsing lines.

  parse_lines(data, lang, callback) {

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
      if(lang.is_comment(line) || in_multi) {

        if(lang.starts_multi_comment(line) && !lang.ends_multi_comment(line))
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
    
  }

  get_rel_path() {
    return './' + path.relative('/' + this.get_link(), '/');
  }

  get_rel_link(link) {
    return path.relative(this.get_rel_path(), link);
  }

  // This function just invokes Hogan.js to produce the HTML output.
  render(sections, language, callback) {
    
    if(!language) language = this.language;

    for(i=0; i<this.sections.length; i++) {
      this.sections[i].done();
    }

    var i;

    // Relative path to the output root, in filesystem-space.  For the
    // file `docs/foo/bar/`, `rel_path` would be `./../../`. It's used
    // for inter-file linking and CSS/JS.
    this.default_template_data.path = this.get_rel_path();

    // Get a list of all of the other files' filenames and URLs except
    // this one.
    var filenames = this.project.get_link_filenames(this);

    var md = null;

    if(this.sections.length == 1 && this.sections[0].code_is_markdown) {
      md = this.sections[0].code_highlighted;
    }

    var classes = [];

    if(this.index) classes.push('index');
    
    if(md) classes.push('markdown');
    else   classes.push('code');

    var html_sections = '';

    for(i=0; i<this.sections.length; i++) {
      html_sections += this.sections[i].render();
    }

    var html_filenames = '';

    for(i=0; i<filenames.length; i++) {
      html_filenames += this.project.templates.file.render(merge(this.default_template_data, filenames[i]));
    }

    var html_links = '';

    var links = Object.keys(this.project.options.links).sort();

    var type_names = {
      github: {
        name: "GitHub",
        desc: "View on GitHub"
      },
      twitter: {
        name: "Twitter",
        desc: "Follow on Twitter"
      },
      home: {
        name: "Homepage",
        desc: "Project homepage"
      }
    };

    for(i=0; i<links.length; i++) {
      var type = links[i]
      var link = this.project.options.links[type];

      if(!(type in type_names)) {
        this.project.fire('link-type-unknown', type);
        continue;
      }
      
      html_links += this.project.templates.link.render({
        url: link,
        name: type_names[type].name,
        desc: type_names[type].desc,
        type: type
      });
    }

    // HOGAN, DO YOUR THING!
    this.html = this.project.templates.page.render(merge(this.default_template_data, {
      title: (this.index ? this.project.options.name : this.filename),
      version: this.project.options.version,
      language: this.language.name.human,
      markdown: md,
      index: this.index,
      filename: this.filename,
      files: html_filenames,
      classes: classes.join(' '),
      sections: html_sections,
      links: html_links
    }));

    callback(null, this.html);
  }

  // Get the output filename, in filesystem-space. For `bin/main.js`,
  // this returns `docs/bin/main.js/index.html`
  get_output_filename() {
    return path.join(this.project.options.output, this.path, 'index.html');
  }

  // Same as above, but server-space. With `bin/main.js`, this returns
  // `bin/main.js/`. It's used for pretty links in `<a>` tags.
  get_link() {
    if(this.index) return './';
    return path.join(this.path, '/');
  }

  // Write the generated file.
  write(callback) {

    var filename = this.get_output_filename();

    var scope = this;

    fs.mkdirs(path.dirname(filename), function (err) {
      if(err) {
        callback(err, null);
        return;
      }

      // Yeah, yeah, I know, callback hell. What's the harm in using it once?
      
      fs.writeFile(filename, scope.html, function(err) {
        
        if(err) {
          callback(err, null);
          return;
        }

        callback(null, null);

      });      
      
    });


  }

  // A mega-function that calls most of the above functions, in the
  // proper order thanks to `run-auto`.
  
  parse_file(err, data, callback) {

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
      
      render: ['parse_lines', 'language', function(next, results) {
        
        scope.render.call(scope, results.parse_lines, results.language, function(err, data) {

          scope.html = data;
          
          next(err, data);
          
        });
          
      }],
      
      write: ['render', function(next, results) {
        
        scope.write.call(scope, function(err, data) {

          next(err, data);
          
        });
          
      }]
      
    }, function(err, results) {
      callback(err, scope);
    });
    
  }

  parse(callback) {
    var scope = this;
    
    fs.readFile(this.filename, 'utf8', function(err, data) {
      scope.parse_file.call(scope, err, data, callback);
    });

  }
  
  // And call the above functions. (This is separate so I can split
  // out "parsing" and "running" in the near future, to allow
  // inter-file linking, etc.)
  
  run(callback) {
    this.parse(callback);
  }
  
}

exports.File = File;
