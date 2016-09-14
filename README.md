
# inline documentation generator

Inspired heavily by [`docco`](https://jashkenas.github.io/docco/),
`indoc` is a quick-and-dirty documentation generator written in plain
JavaScript. It can be run either from the command line or included as
a `node.js` library.

Unlike `docco`, `indoc` has the concept of a `project`; instead of
having a hacky "Jump To" menu, `indoc` has an integrated file listing
on each generated page. (Check it out on the left.)

The recommended usage is to install `indoc` globally and use a local
project config file with the `-c` command line option.

```sh
$ ls
bin/     lib/     src/     README.md   indoc.json
$ more indoc.json
{
  "name": "Mousetrap Simulation Library"
  "owners": "Tom",
  "output": "docs",
  "readme": "README.md",
  "version": "package.json",
  "files": [
    "src/**/*.js"
  ]
}
$ indoc -c indoc.json
info: Generated "README.md"
info: Generated "src/animal.js"
info: Generated "src/cat.js"
info: Generated "src/mouse.js"
info: Generated "src/trap.js"
info: Successfully generated 5 files
$ ls
bin/     docs/    lib/     src/     README.md   indoc.json
$ ls docs/
index.html README.md/    animal.js/    cat.js/    mouse.js/     trap.js/
$ 
```

# Getting the library

```
npm install -g indoc
```

The command `indoc` should now be available.

Alternatively, use

```
npm install indoc
```

to use the library as a `node.js` module.

# Using the command line program

```
$ indoc [options] files...
```

### `-c <config>` or `--config <config>`

Sets a config file to read configuration options from. If used, the
rest of the arguments are ignored.

Example config file:

```js
{
  "name": "Mousetrap Simulation Library"
  "owners": "Tom",
  "output": "docs",
  "readme": "README.md",
  "version": "package.json",
  "files": [
    "src/animal.js",
    "src/cat.js",
    "src/mouse.js",
    "src/trap.js"
  ]
}
```

### `-h` or `--help`

Displays help. If you need to consult the README to find this
argument, you shouldn't be using `indoc` in the first place.

### `-v` or `--version`

Displays the program's `semver`; for example, `0.1.0`, then exits.

```
$ indoc --version
0.3.2
$
```

### `-r <file>` or `--readme <file>`

Provide a README file, to be used on the project's overview page. This
file will be parsed as Markdown.

### `-n <name>` or `--name <name>`

Set the user-facing name of the project.

### `-o <directory>` or `--output <directory>`

Set the output directory (the default is `docs`).

### `--owners <owners>`

Sets a string. By default, it's `contributors`. This string is at the
footer of every generated page.

### `-p <version>` or `--project-version <version>`

Sets the project version. This is displayed on every page. The special
string `package.json` will attempt to read the `package.json` file and
find the version there.

# Using the library

```js
var indoc = require('indoc');

var project = new indoc.Project({
  name: 'Mousetrap Simulation Library',
  owners: 'Tom', // "Copyright 2016 Tom"
  output: 'docs',
  readme: 'README.md',
  version: 'package.json', // the special string "package.json" will open the file "package.json" and read the version string there
  links: {
    github: "https://github.com/tom/mousetrap-sim",
    twitter: "https://twitter.com/mousetrapsim"
  },
  files: [
    'src/animal.js',
    'src/cat.js',
    'src/mouse.js',
    'src/trap.js'
  ]
});

project.run(function(err, data) {
  console.log('Generated ' + data.total + ' files!');
});
```

# External Project Links

You can reference external links with the `links` key in
`options`. Currently supported link types are:

* `github`
* `twitter`
* `home`

# Languages

The languages supported by `indoc` are stored in `lib/languages.json` in the following format:

```javascript
"JSFOO": {
  "extensions": [
    "js", "json"
  ],
  "name": {
    "hljs": "JavaScript",  // the language type for Highlight.js, 'auto' to autodetect, or `null` for Markdown
    "human": "JavaScript", // the human-readable language name. If not present, the name of the language
                           // (JSFOO, above) is used instead.
    "abbr": "JS"           // The short abbreviation of the language. If not present, the first item in
                           // "extensions", above, is used.
  },
  "single": [ "//", ";;" ],
  "multi": [
    ["/*", "*", "*/"]
  ],
  "ignore": [
    "eslint-disable"
  ]
}
```

Right now, if there's a language that's not included or not set up to
your liking, you can use the `languages` field of the `options`
argument of the `indoc.project` to add new languages or modify
existing ones:

```javascript
var project = new indoc.Project({
  name: 'Mousetrap Simulation Library',

  ...

  files: [ ... ],
  languages: {
    'SubScript': {
      extensions: [
        'sub', 'sbs'
      ],
      name: {
        hljs: 'JavaScript', // the language type for Highlight.js, or null
        human: 'JavaScript',
        abbr: 'JS'
      },
      single: [ '//', ';;' ], // a single-line comment starts with '//' or ';;'
      multi: [
        ['/*', '*', '*/'] /* See below for an explanation of how multiline comments work. */
      ],
      ignore: [
        'hideme!' // hideme! (this comment will be ignored)
      ]
    }
  }
  });
  
  /* a multi-line comment starts with '/*' and ends with '*/'.
  * Optionally, if a line starts with '*', it will be removed
  * to allow for indented multi-line comments, like this one.
  * Both `single` and `multi` allow for multiple comment formats.
  * */

```


# Contributing/Feedback

At the moment, `indoc` is very, very new. It would probably be better
if, instead of contributing code, you
[open new issues](https://github.com/zlsa/indoc/issues). I'd like to
see `indoc` stabilize more before changing major areas of its
functionality.

## Contributing languages

Just edit `lib/languages.json` and open a PR with the languages you've
included. Make sure that the JSON still validates and that `indoc`
runs without any problems. Thanks!

# License

Copyright (c) 2016 ZLSA Design.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

