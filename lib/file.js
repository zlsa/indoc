
var fs = require('fs-extra');
var path = require('path');

var c = require('./class').class;
var auto = require('run-auto');
var section = require('./section').section;
var language = require('./language');
var detect = require('language-detect');

function t() {
  return Date.now() * 0.001;
}

function e(time, m) {
  console.log((t() - time).toFixed(2) + 's ' + (m || ''));
}

exports.file = c.extend({
  init: function(project, filename) {
    this.project = project;
    
    this.filename = filename;
  },

  parse: function(callback) {
    var scope = this;
    
    fs.readFile(this.filename, 'utf8', function(err, data) {
      scope.parse_file.call(scope, err, data, callback);
    });

  },

  preprocess_file: function(data, callback) {
    callback(null, data);
  },

  split_lines: function(data, callback) {
    var lines = data.split(/\r?\n/);

    callback(null, lines);
  },
  
  detect_language: function(data, callback) {
    var scope = this;
    
    detect(this.filename, function (err, lang) {
      
      var l = language.language.create(scope.project, scope, lang);
      callback(err, l);
      
    });
    
  },

  parse_lines: function(data, lang, callback) {
    var sections = [];

    var scope = this;
    
    function add_section() {
      if(sections.length == 0 || !current_section().is_empty()) {
        sections.push(section.create(scope.project, scope, lang));
      } else {
      }
    }

    add_section();

    function current_section() {
      return sections[sections.length-1];
    }

    var in_comment = false,
        line,
        comment,
        i;

    for(i=0; i<data.length; i++) {
      line = data[i];

      if(lang.is_comment(line)) {
        
        comment = lang.strip_comment(line);
        
        if(!in_comment) {
          add_section();
          current_section().comment += comment + '\n';
          in_comment = true;
        }
        
      } else {
        in_comment = false;
        if(sections.length == 1 && !current_section().code.trim() && !line.trim()) continue;
        if(!current_section().code.trim() && !line.trim()) continue;
        current_section().code += line + '\n';
      }
      
    };

    for(i=0; i<sections.length; i++) {
      sections[i].done();
    }
    
    callback(null, sections);
    
  },

  generate_output: function(sections, language, callback) {

    var i;

    var rel_path = './' + path.relative('/' + this.get_link(), '/');

    var filenames = this.project.get_link_filenames(this);

    var page = this.project.templates.page({
      project: this.project.options.name || 'Project Overview',
      title: this.filename,
      filename: this.filename,
      files: filenames,
      path: rel_path,
      sections: sections
    });
    
    callback(null, page);

  },

  get_output_filename: function() {
    var fn = path.parse(this.filename);
    return path.join(this.project.options.output, path.dirname(this.filename), fn.name, 'index.html');
  },

  get_link: function() {
    var fn = path.parse(this.filename);
    return path.join(path.dirname(this.filename), fn.name) + '/';
  },

  write: function(output, callback) {

    var scope = this;

    fs.mkdirs(path.dirname(this.get_output_filename()), function (err) {
      if(err) {
        callback(err, null);
        return;
      }
      
      fs.writeFile(scope.get_output_filename.call(scope), output, function(err) {
        
        if(err) {
          callback(err, null);
          return;
        }

        callback(null, null);

      });      
      
    });


  },

  parse_file: function(err, data, callback) {

    var scope = this;
    
    if(err) {
      callback(err, this);
      return;
    }

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
  
  run: function(callback) {
    this.parse(callback);
  }
  
});
