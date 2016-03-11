
# inline documentation generator ([GitHub repo](http://github.com/zlsa/indoc/))

Inspired heavily by [`docco`](https://jashkenas.github.io/docco/),
`indoc` is a quick-and-dirty documentation generator written in plain
JavaScript. It can be run either from the command line or included as
a library. The first line of `indoc` was laid down on a hard drive on
March 10th, 2016; so if it seems rough around the edges, that's
because it's still brand-new. (However, since this is a hipster app
that's written in JavaScript, v1.0 is coming within days! Either
that or it'll be stuck on v0.0.1 forever. Such are the woes of using
hipster languages.)

Unlike `docco`, `indoc` has the concept of a `project`; instead of
having a hacky "Jump To" menu, `indoc` has an integrated file listing
on each generated page. (Check it out on the left.)

# Getting the library

```
npm install -g indoc
```

The command `indoc` should now be available.

# Using the command line program

```
$ indoc [options] files...
```

### `-c <config>` or `--config <config>`

Sets a config file to read configuration options from. If used, the
rest of the arguments are ignored.

Example config:

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

# Using the library

```js
var indoc = require('indoc');

var project = indoc.project.create({
  name: 'Mousetrap Simulation Library'
  owners: 'Tom', // "Copyright 2016 Tom"
  output: 'docs',
  readme: 'README.md',
  version: 'package.json', // the special string "package.json" will open the file "package.json" and read the version string there
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

# Contributing/Feedback

At the moment, `indoc` is very, very new. It would probably be better
if, instead of contributing code, you
[create new issues](https://github.com/zlsa/indoc/issues). The project
is very new, and I'd like to see it stabilize more before changing
major areas of its functionality.

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

