'use strict';

// Wow. I require a lot of things here. Without them, I wouldn't be
// happy.

const fs         = require('fs-extra');
const path       = require('path');
const merge      = require('merge');
const hogan      = require('hogan.js');
const parallel   = require('run-parallel');
const auto       = require('run-auto');
const glob_copy  = require('glob-copy');
const jsonfile   = require('jsonfile');
const glob       = require("glob");

const Events     = require('./events');
const section    = require('./section');
const file       = require('./file');
const language   = require('./language');

// The project thingy.

class Project extends Events {
  
  constructor(options) {

    super();

    // A list of filenames.
    this.filenames = [];

    // A list of files. (See [`file.js`]('../file.js'))
    this.files = [];

    // Merge the options argument with some sane defaults.
    this.options = merge({
      name: null,
      files: [],
      ignore: [],
      owners: 'contributors',
      output: 'docs',
      readme: null,
      version: null,
      links: {},
      languages: {}
    }, options);

    this.ignored = [];

    // Templates, along with a flag to avoid premature running.
    this.templates = {};
    this.templates_ready = false;

    this.default_template_data = {
      project: this.options.name,
      title: this.options.name,
      path: '',
      classes: '',
      year: new Date().getUTCFullYear(),
      owners: this.options.owners,
      generate_time: new Date().toUTCString(),
      links: this.options.links
    };

    // Gentlemen, prepare your templates!
    this.prepare_templates();
  }
  
  // This just reads a file and creates a Hogan template from it.
  
  prepare_template(filename, callback) {

    fs.readFile(filename, 'utf-8', function(err, data){
      
      if(err) {
        callback(err, data);
        return;
      }
      
      var template = hogan.compile(data);

      callback(err, template);
      
    });
  }

  get_file(filename) {
    
    for(var i=0; i<this.files.length; i++) {
      if(this.files[i].filename == filename) return this.files[i];
    }
    
    return null;
  }

  // This prepares a list of templates, as well as emitting the proper
  // events when things happen.
  
  prepare_templates() {
    var i,
        templates = [
          ['page', 'page.html'],
          ['file', 'file.html'],
          ['link', 'link.html'],
          ['section', 'section.html']
        ];

    // When `total == complete`, the templates are all loaded.
    var complete = 0,
        total = templates.length;

    var scope = this;

    for(i=0; i<templates.length; i++) {

      // New function for the loop.
      
      (function(name, filename) {
        var true_filename = path.join(__dirname, 'template', filename);
        
        scope.prepare_template.call(scope, true_filename, function(err, template) {

          // Yay, one more done!
          
          complete += 1;

          if(err) {
            scope.emit.call(scope, 'template-err', { filename: true_filename });
          } else {
            scope.templates[name] = template;
            scope.emit.call(scope, 'template-ready', { template: template });
          }
          
          if(complete == total) {
            scope.templates_ready = true;
            scope.emit.call(scope, 'templates-ready');
          }
          
        });
      })(templates[i][0], templates[i][1]);
      
    }
  }

  // Adds all the filenames to `this.filenames`, while removing duplicates.

  add_files(files) {
    
    var i;
    for(i=0; i<files.length; i++) {
      
      if(this.filenames.indexOf(files[i]) < 0) {
        this.filenames.push(files[i]);
      } else if(files[i].startsWith(this.options.output)) {
        this.emit('recursive-file', { filename: files[i] });
      }
      
    }

  }

  // Replaces `this.filenames` with the un-globbed version.

  glob_files() {
    var filenames = [], i;

    for(i=0; i<this.filenames.length; i++) {
      filenames.push.apply(filenames, glob.sync(this.filenames[i]));
    }

    this.filenames = filenames;
  }
  
  // Initializes `this.ignored`

  glob_ignore(ignore) {
    var filenames = [], i;

    for(i=0; i<ignore.length; i++) {
      filenames.push.apply(filenames, glob.sync(ignore[i]));
    }

    this.ignored = filenames;
  }

  // Do I really need to tell you!?
  sort_files() {

    // This nifty little function returns the directory, the
    // extension, and then the filename. For example, `lib/main.js`
    // will result in `lib/.jsmain`. This is used to separate
    // different file types (and avoid `script.js` and `style.css`
    // from being next to each other.)
    
    function id(a) {
      var parsed = path.parse(a);
      return parsed.dir + parsed.ext + parsed.name;
    }
    
    this.filenames.sort(function(a, b) {
      if(id(a) < id(b)) return -1;
      if(id(a) > id(b)) return 1;
      return 0;
    });
  }

  remove_duplicate_files() {
    var filenames = [];

    for(var i=0; i<this.filenames.length; i++) {
      if(filenames.indexOf(this.filenames[i]) >= 0) {
        if(this.filenames[i] == this.options.readme) continue;
        this.emit('duplicate-file', { filename: this.filenames[i] });
      } else {
        filenames.push(this.filenames[i]);
      }
    }

    this.filenames = filenames;
  }
  
  remove_ignored_files() {
    var filenames = [], i;

    for(i=0; i<this.filenames.length; i++) {
      if(this.ignored.indexOf(this.filenames[i]) >= 0) {
        continue;
      } else {
        filenames.push(this.filenames[i]);
      }
    }

    this.filenames = filenames;
  }
  
  // Ugh, bad naming. Copies a list of globbed filenames.
  
  copy(files, callback) {
    if(!Array.isArray(files)) files = [files];
    var total = files.length,
        complete = 0,
        scope = this;
    
    function copy_single_glob(filename, cb) {

      var src = path.join(__dirname, 'public', filename),
          dest = path.join(scope.options.output, 'public');

      // Make the directories, first. `glob_copy` does not like
      // laziness.
      
      fs.mkdirs(dest, function (err) {
        glob_copy(src, dest, function(err, results) {
          cb(null, null);
        });
      });
    }
    
    for(var i=0; i<files.length; i++) {
      
      copy_single_glob(files[i], function() {
        complete += 1;
        if(complete == total)
          callback.apply(callback, arguments);
      });
      
    }
  }
  
  copy_css(callback) {
    this.copy('style.css', callback);
  }
  
  copy_images(callback) {
    this.copy('*.png', callback);
  }
  
  copy_js(callback) {
    this.copy('*.js', callback);
  }
  
  copy_fonts(callback) {
    this.copy(['*.eot', '*.woff'], callback);
  }

  // Calls the above four functions in parallel, then calls the
  // callback when they're all done.
  
  copy_public(callback) {
    var scope = this;
    
    parallel([
      
      function(next) {
        scope.copy_js.call(scope, next);
      },

      function(next) {
        scope.copy_css.call(scope, next);
      },
      
      function(next) {
        scope.copy_fonts.call(scope, next);
      },
      
      function(next) {
        scope.copy_images.call(scope, next);
      }
    ], callback);
    
  }

  each_file(func, callback) {
    
    var scope = this,
        total = this.files.length,
        complete = 0,
        errors = 0;
    
    var i;

    // Inline functions to reduce complexity in the loop.

    function run_complete() {
      callback({
        total: total,
        complete: complete,
        errors: errors
      });
    }

    // Called when a single file is complete.
    
    function file_complete(err, data) {
      if(err) errors += 1;
      complete += 1;
      // WE ARE DONE! YAY! WOOHOO!
      if(total == complete) run_complete();
    };

    // The loop is nice and tiny, just like a loop should be.
    
    for(i=0; i<this.files.length; i++) {
      func(this.files[i], file_complete);
    }

  }

  // For each file, run it.
  run_files(callback) {

    var i, f;

    if(this.options.readme) {
      this.add_files([this.options.readme]);
    }
    
    this.glob_ignore(this.options.ignore);
    
    this.add_files(this.options.files);

    this.glob_files();
    
    this.remove_duplicate_files();
    this.remove_ignored_files();
    
    this.sort_files();

    var scope = this,
        total = this.filenames.length + 1,
        complete = 1,
        errors = 0;
    
    if(this.filenames.length == 0) {
      console.log('! no files to parse');
      return false;
    }

    for(i=0; i<this.filenames.length; i++) {
      f = new file.File(this, this.filenames[i]);
      this.files.push(f);
    }

    if(this.options.readme) {
      f = new file.File(this, this.options.readme);
      f.index = true;
      f.path = '';
      this.files.push(f);
    }

    this.each_file(function(file, callback) {
      
      file.run(function(err, data) {
        scope.emit.call(scope, 'run-file-complete', { err: err, data: data });
        callback(err, data);
      });
      
    }, function(data) {
      scope.emit.call(scope, 'run-complete', data);

      if(callback) {
        callback(null, data);
      }
    });

    return true;
    
  }

  // Returns a list of all the filenames and link URLs (used to create
  // the file listing in the sidebar.)
  
  get_link_filenames(file) {

    var i, filenames=[], last_path_dir;
    
    for(i=0; i<this.files.length; i++) {

      // Used to avoid duplicated files.
      
      if(this.files[i] === file) continue;

      if(this.files[i].filename === this.options.readme) continue;
      
      if(this.files[i].index) continue;
      
      var lang = language.get_language(path.extname(this.files[i].filename).substr(1), {});
      if(lang[1] === 'auto') lang = null;
      else                  lang = lang[0];
      
      filenames.push({
        filename: this.files[i].filename,
        link: path.relative(file.get_link(), this.files[i].get_link()),
        separator: ((path.dirname(this.files[i].filename) != last_path_dir) && filenames.length ? true : false),
        language: (lang ? lang.name.abbr : null),
        color: (lang ? lang.color : '#f0f')
      });

      last_path_dir = path.dirname(this.files[i].filename);
      
    }

    return filenames;
  }

  // Copies the files and generates the overview, thanks to `run-auto`.
  
  _run(callback) {

    var scope = this;
    
    function r() {
      
      auto({
        
        files: function(next) {
          scope.run_files.call(scope, function(err, data) {
            next(err, data);
          });
        },
        
        copy: function(next) {
          scope.copy_public.call(scope, function(err, data) {
            next(err, data);
          });
        }
        
      }, function(err, results) {
        callback(err, results.files);
      });
    }

    if(this.options.version == 'package.json') {
      
      jsonfile.readFile('package.json', function(err, data) {
        
        if(err || !('version' in data)) {
          scope.emit.call('package-json-err');
          return;
        }
        
        scope.options.version = data.version;
        
        r();
        
      });
      
    } else {
      r();
    }
             
  }

  // A wrapper, to avoid running before the templates are completely
  // loaded.
  
  run(callback) {
    
    if(this.templates_ready) {
      
      this._run(callback);
      
    } else {
      
      var scope = this;
      
      this.on('templates-ready', function() {
        scope._run.call(scope, callback);
      });
      
    }
    
  }
  
}

exports.Project = Project;

exports.project = {
  create: function(options) {
    return new Project(options);
  }
};

