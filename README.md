
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

## Command line arguments

```
$ indoc [options] files...
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

## Using the library

```js
var indoc = require('indoc');

var project = indoc.project.create({
  files: [
    'src/animal.js',
    'src/cat.js',
    'src/mouse.js',
    'src/trap.js'
  ],
  readme: 'README.md',
  name: 'Mousetrap Simulation Library'
});

project.run(function(err, data) {
  console.log('Generated ' + data.total + ' files!');
});
```

