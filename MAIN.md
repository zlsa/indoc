
# inline documentation generator ([GitHub repo](http://github.com/zlsa/indoc/))

> (Psst: check out [README.md](README.md) for help on how to use the library)

Right now, you're looking at the output of `indoc`, run on its own
source code (plus a few examples, to demonstrate handling of various
languages).

The source code for the `indoc` project is on the left; the primary
files are [bin/main.js](bin/main.js), the primary entrance point for
the `indoc` command-line program; [lib/main.js](lib/main.js), the main
entry point for the `indoc` library when you `require()` it; and
[lib/file.js](lib/file.js), which parses and formats the output files
with `handlebars`, `marked`, and `highlight.js`.
