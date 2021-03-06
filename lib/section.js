
const path = require('path');
const hljs = require('highlight.js');
const marked = require('marked');
const c = require('./class').class;
const merge = require('merge');

// Helper function to avoid duplication.
  
exports.markdown = function(text, file) {

  var renderer = new marked.Renderer();

  renderer.heading = function(text, level) {
    var escaped = text.toLowerCase().replace(/<(?:.|\n)*?>/gm, '').replace(/[^\w]+/g, '-');

    return '<h' + level + ' id="' + escaped + '">' +
           text + '</h' + level + '>';
  };

  // # Project file linking
  // You can link to files in the project by prefixing the URL with `:`.
  // See [MARKDOWN.md](:/MARKDOWN.md#project-file-linking) for more info.
  
  renderer.link = function(href, title, text) {
    if(!title) title = '';

    // Only do this if the link URL starts with `:`
    
    if(file && href.startsWith(':')) {

      // If the URL contains only `:`, use the text as the URL

      if(href == ':') href = text;
      else            href = href.substr(1);

      var current_path = file.get_link();

      // Remove the ending '/' that `file.get_link()` returns
      
      current_path = current_path.substr(0, current_path.length - 1);

      // Make sure index linking works properly

      if(file.index) current_path = '';

      var current_dir = path.dirname(current_path);

      var link_filename = href;

      if(!link_filename.startsWith('/'))
        link_filename = path.join(current_dir, link_filename);

      if(link_filename.startsWith('/')) link_filename = link_filename.substr(1);

      var hash = link_filename.split('#');
      
      if(hash.length == 2) {
        link_filename = hash[0];
        hash = '#' + hash[1];
      } else {
        hash = '';
      }
      
      var link_file = file.project.get_file(link_filename);

      if(link_file) {
        href = path.relative('/' + current_path, '/' + link_file.get_link()) + '/' + hash;
      } else {
        file.project.emit('project-link-err', {
          filename: file.filename,
          link: href
        });
        
      }
      
    }
    
    return '<a href="' + href + '" title="' + title + '">' + text + '</a>';
  };

  return marked(text, {
    renderer: renderer,
    highlight: function(code, lang) {
      if(!lang)
        return hljs.highlightAuto(code).value;
      else
        return hljs.highlight(lang, code).value;
    },
    sanitize: true
    
  });
};

// A section contains a comment and code.

exports.section = c.extend({
  
  init: function(project, file, language) {
    this.project = project;
    
    this.file = file;

    // The language is set from the file's language.

    this.language = language;

    this.comment = '';
    this.comment_markdown = '';
    
    this.code = '';
    this.code_highlighted = '';

    this.code_is_markdown = false;

    this.html = '';
  },

  highlight_code: function() {
    this.code = this.code.replace(/\s+$/g, '');
    
    if(this.language.name.hljs == null) {
      this.code_is_markdown = true;
      this.code_highlighted = exports.markdown(this.code, this.file);
    } else if(this.language.name.hljs == 'auto') {
      this.code_highlighted = hljs.highlightAuto(this.code).value;
    } else {
      try {
        this.code_highlighted = hljs.highlight(this.language.name.hljs, this.code).value;
      } catch(e) {
        this.project.emit('language-highlight-err', { language: this.language.name.hljs, filename: this.file.filename });
        this.code_highlighted = hljs.highlightAuto(this.code).value;
        this.language.name.hljs = 'auto';
      }
    }
  },

  parse_markdown: function() {
    this.comment_markdown = exports.markdown(this.comment, this.file);
  },

  done: function() {
    this.code = this.code;
    this.comment = this.comment.trim();
    
    this.highlight_code();
    this.parse_markdown();
  },

  // Returns true if both the comment and the code contain no more than whitespace.

  is_empty: function() {
    if(!this.comment.trim() && !this.code.trim()) return true;
    return false;
  },

  render: function() {
  
    this.html = this.project.templates.section.render(merge(this.project.default_template_data, {
      comment_markdown: this.comment_markdown,
      code_highlighted: this.code_highlighted
    }));

    return this.html;

  }
    
});
