
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

exports.project = c.extend({
  
  init: function(options) {
    this.filenames = [];
    this.files = [];

    this.options = merge({
      name: null,
      files: [],
      output: 'docs',
      readme: null
    }, options);

    this.templates = {};
    this.templates_ready = false;
    
    this.prepare_templates();
  },
  
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

  prepare_templates: function() {
    var i,
        templates = [
          ['page', 'page.html']
        ];

    var complete = 0,
        total = templates.length;

    var scope = this;

    for(i=0; i<templates.length; i++) {
      (function(name, filename) {
        var true_filename = path.join(__dirname, 'template', filename);
        scope.prepare_template.call(scope, true_filename, function(err, template) {

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

  glob_files: function() {
    var filenames = [];

    for(i=0; i<this.filenames.length; i++) {
      filenames.push.apply(filenames, glob.sync(this.filenames[i]));
    }

    this.filenames = filenames;
  },

  sort_files: function() {
    this.filenames.sort();
  },

  copy: function(filename, callback) {
    var scope = this,
        src = path.join(__dirname, 'public', filename),
        dest = path.join(scope.options.output, 'public', filename);
    
    fs.copy(
      src,
      dest,
      function(err, results) {
        if(err)
          scope.emit.call(scope, 'copy-err', {
            filename: filename,
            src: src,
            dest: dest
          });
        callback(null, null);
      });
  },
  
  glob_copy: function(filename, callback) {
    var scope = this,
        src = path.join(__dirname, 'public', filename),
        dest = path.join(scope.options.output, 'public');

    glob_copy(
      src,
      dest,
      function(err, results) {
        callback(null, null);
      });
  },
  
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
  
  run_files: function(callback) {

    this.glob_files();
    
    this.sort_files();
      
    this.add_files(this.options.files);

    var scope = this,
        total = this.filenames.length + 1,
        complete = 1,
        errors = 0;

    if(this.filenames.length == 0) {
      console.log('! no files to parse');
      return false;
    }

    var i, f;

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
    
    function file_complete(err, data) {

      if(err) errors += 1;
      
      scope.emit.call(scope, 'run-file-complete', { err: err, data: data });

      complete += 1;
      if(total == complete) {
        run_complete();
      }
      
    };

    for(i=0; i<this.filenames.length; i++) {
      f = file.file.create(this, this.filenames[i]);
      f.run(file_complete);
      this.files.push(f);
    }

    return true;
    
  },
  
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

  generate_overview: function(callback) {
    
    var scope = this;
    
    auto({

      readme: function(next) {

        if(!scope.options.readme) {
          next(null, '# No README provided');
          return;
        }
        
        fs.readFile(scope.options.readme, 'utf8', function(err, data) {

          if(err) {
            scope.emit.call(scope, 'readme-err', { err: err, data: { filename: scope.options.readme } });
            next(null, '# No README provided');
            return;
          }

          next(err, data);

        });
      },

      write: ['readme', function(next, results) {
        
        var page = scope.templates.page.call(scope.templates.page, {
          title: scope.options.name || 'Project Overview',
          classes: 'overview',
          files: scope.get_link_filenames.call(scope),
          path: '.',
          readme: section.markdown(results.readme)
        });
        
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
