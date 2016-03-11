
var hljs = require('highlight.js');
var marked = require('marked');
var c = require('./class').class;

marked.setOptions({
  highlight: function(code, lang) {
    if(!lang)
      return hljs.highlightAuto(code).value;
    else
      return hljs.highlight(lang, code).value;
  }
});

exports.markdown = function(text) {
  return marked(text);
};

exports.section = c.extend({
  
  init: function(project, file, language) {
    this.project = project;
    
    this.file = file;

    this.language = language;

    this.comment = '';
    this.comment_markdown = '';
    
    this.code = '';
    this.code_highlighted = '';
  },

  highlight_code: function() {
    this.code_highlighted = hljs.highlight(this.language.name.hljs, this.code).value;
  },

  parse_markdown: function() {
    this.comment_markdown = marked(this.comment);
  },

  done: function() {
    this.code = this.code;
    this.comment = this.comment.trim();
    
    this.highlight_code();
    this.parse_markdown();
  },

  is_empty: function() {
    if(!this.comment.trim() && !this.code.trim()) return true;
    return false;
  }
  
});
