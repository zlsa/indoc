
// Wow. I require a lot of things here. Without them, I wouldn't be
// happy.

var fs = require('fs-extra');
var path = require('path');
var merge = require('merge');
var handlebars = require('handlebars');
var parallel = require('run-parallel');
var auto = require('run-auto');
var glob_copy = require('glob-copy');
var glob = require("glob");

var section = require('./section');
var file = require('./file');

var c = require('./class').class;

// The project thingy.

exports.project = c.extend({
  
  init: function(options) {

    // A list of filenames.
    this.filenames = [];

    // A list of files. (See [`file.js`]('../file.js'))
    this.files = [];

    // Merge the options argument with some sane defaults.
    this.options = merge({
      name: null,
      files: [],
      owners: 'contributors',
      output: 'docs',
      readme: null
    }, options);

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
      generate_time: new Date().toUTCString()
    };

    // Gentlemen, prepare your templates!
    this.prepare_templates();
  },
  
  // This just reads a file and creates a Handlebars template from it.
  
  prepare_template: function(filename, callback) {

    fs.readFile(filename, 'utf-8', function(err, data){
      if(err) {
        callback(err, data);
        return;
      }
      
      var template = handlebars.compile(data);

      callback(err, template);
      
    });
  },

  // This prepares a list of templates, as well as emitting the proper
  // events when things happen.
  
  prepare_templates: function() {
    var i,
        templates = [
          ['page', 'page.html'] // I know there's only one template here. Shut up.
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
  },

  // Adds all the filenames to `this.filenames`, while removing duplicates.

  add_files: function(files) {
    var i;
    for(i=0; i<files.length; i++) {
      if(this.filenames.indexOf(files[i]) < 0) {
        this.filenames.push(files[i]);
      } else {
        this.emit('duplicate-file', { filename: files[i] });
      }
    }
  },

  // Replaces `this.filenames` with the un-globbed version.

  glob_files: function() {
    var filenames = [];

    for(i=0; i<this.filenames.length; i++) {
      filenames.push.apply(filenames, glob.sync(this.filenames[i]));
    }

    this.filenames = filenames;
  },

  // Do I really need to tell you!?
  sort_files: function() {
    this.filenames.sort();
  },

  // Copy `lib/public/filename` to `docs/public/filename`.
  
  copy: function(filename, callback) {
    var scope = this,
        src = path.join(__dirname, 'public', filename),
        dest = path.join(scope.options.output, 'public', filename);

    // Because I'm using `fs-extra`, I don't need to make the
    // directories first. Yay for laziness!
    
    fs.copy(src, dest, function(err, results) {
      if(err)
        scope.emit.call(scope, 'copy-err', {
          filename: filename,
          src: src,
          dest: dest
        });
      callback(null, null);
    });
  },

  // Like the above, but globby.
  
  glob_copy: function(filename, callback) {
    var scope = this,
        src = path.join(__dirname, 'public', filename),
        dest = path.join(scope.options.output, 'public');

    // Make the directories, first. `glob_copy` does not like
    // laziness.
    
    fs.mkdirs(dest, function (err) {
      glob_copy(src, dest, function(err, results) {
        callback(null, null);
      });
    });
  },

  // Ugh, bad naming. Copies a list of globbed filenames.
  
  copy_glob: function(files, callback) {
    var total = files.length;
    var complete = 0;
    
    for(var i=0; i<files.length; i++) {
      this.glob_copy(files[i], function() {
        complete += 1;
        if(complete == total)
          callback.apply(callback, arguments);
      });
    }
  },
  
  copy_css: function(callback) {
    this.copy('style.css', callback);
  },
  
  copy_images: function(callback) {
    this.copy_glob(['*.png'], callback);
  },
  
  copy_js: function(callback) {
    this.copy_glob(['*.js'], callback);
  },
  
  copy_fonts: function(callback) {
    this.copy_glob(['*.eot', '*.woff'], callback);
  },

  // Calls the above four functions in parallel, then calls the
  // callback when they're all done.
  copy_public: function(callback) {
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
    
  },

  // For each file, run it.
  run_files: function(callback) {

    this.add_files(this.options.files);

    this.glob_files();
    
    this.sort_files();
      
    var scope = this,
        total = this.filenames.length + 1,
        complete = 1,
        errors = 0;
    
    // RIP.

    if(this.filenames.length == 0) {
      console.log('! no files to parse');
      return false;
    }

    var i, f;

    // Inline functions to reduce complexity in the loop.

    function run_complete() {

      var data = {
        total: total,
        complete: complete,
        errors: errors
      };
      
      scope.emit.call(scope, 'run-complete', data);

        if(callback) {
          callback(null, data);
        }
    }

    // Called when a single file is complete.
    
    function file_complete(err, data) {

      if(err) errors += 1;
      
      scope.emit.call(scope, 'run-file-complete', { err: err, data: data });

      complete += 1;

      // WE ARE DONE! YAY! WOOHOO!
      if(total == complete) run_complete();
      
    };

    // The loop is nice and tiny, just like a loop should be.
    
    for(i=0; i<this.filenames.length; i++) {
      f = file.file.create(this, this.filenames[i]);
      f.run(file_complete);
      this.files.push(f);
    }

    return true;
    
  },

  // Returns a list of all the filenames and link URLs (used to create
  // the file listing in the sidebar.)
  
  get_link_filenames: function(ignore) {

    var i, filenames=[];
    
    for(i=0; i<this.files.length; i++) {
      if(this.files[i] === ignore) continue;
      filenames.push({
        filename: this.files[i].filename,
        link: this.files[i].get_link()
      });
    }

    return filenames;
  },

  // Generates the home page.
  
  generate_overview: function(callback) {
    
    var scope = this;
    
    auto({

      readme: function(next) {

        if(!scope.options.readme) {
          next(null, '# No README provided');
          return;
        }
        
        fs.readFile(scope.options.readme, 'utf8', function(err, data) {

          // If the readme file doesn't exist:

          if(err) {
            scope.emit.call(scope, 'readme-err', { err: err, data: { filename: scope.options.readme } });
            next(null, '# No README provided');
            return;
          }

          next(err, data);

        });
      },

      write: ['readme', function(next, results) {

        // Nothing fancy here.
        
        var page = scope.templates.page.call(scope.templates.page, merge(scope.default_template_data, {
          title: scope.options.name || 'Project Overview',
          path: '.',
          classes: 'overview',
          files: scope.get_link_filenames.call(scope),
          readme: section.markdown(results.readme)
        }));
        
        var filename = path.join(scope.options.output, 'index.html');
        fs.writeFile(filename, page, function(err) {
          
          scope.emit.call(scope, 'run-file-complete', { err: err, data: { filename: 'index' } });
          
          next(err, null);

        });
      }]

    }, function() {
      callback(null, null);
    });
    
  },

  // Copies the files and generates the overview, thanks to `run-auto`.
  
  _run: function(callback) {
    var scope = this;
    
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
      },
      
      overview: ['files', function(next) {
        scope.generate_overview.call(scope, function(err, data) {
          next(err, data);
        });
      }]
      
    }, function(err, results) {
      callback(err, results.files);
    });
             
  },

  // A wrapper, to avoid running before the templates are completely
  // loaded.
  
  run: function(callback) {
    
    if(this.templates_ready) {
      
      this._run(callback);
      
    } else {
      
      var scope = this;
      
      this.on('templates-ready', function() {
        scope._run.call(scope, callback);
      });
      
    }
    
  }
  
});
