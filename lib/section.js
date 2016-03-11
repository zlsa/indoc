
// Highlightjs, marked.
var hljs = require('highlight.js');
var marked = require('marked');
var c = require('./class').class;

// Global options setting. I'm guaranteed one context anway ATM, and
// creating a new `function` for each invocation sounds silly and
// inefficient.

marked.setOptions({
  highlight: function(code, lang) {
    if(!lang)
      return hljs.highlightAuto(code).value;
    else
      return hljs.highlight(lang, code).value;
  }
});

// Helper function to avoid duplicating the above in [main.js](../main.js)
  
exports.markdown = function(text) {
  return marked(text);
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

  // Returns true if both the comment and the code contain no more than whitespace.

  is_empty: function() {
    if(!this.comment.trim() && !this.code.trim()) return true;
    return false;
  }
  
});
