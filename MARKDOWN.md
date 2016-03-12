
# Special Markdown syntax

`indoc` supports a few nonstandard Markdown features.

## Project file linking

You can link to files in the project by prefixing the URL with `:`;
for example:

```md
[See foobar.js](:foobar.js) <!-- links to ./foobar.js -->
```

will link to `foobar.js` within the project, relative to the current
file. You can also use absolute links if you'd like:

```md
[See foobar.js](:/src/foobar.js) <!-- links to /src/foobar.js -->
```

In addition, if the link text is the filename, you can omit the
filename in the URL:

```md
See [foobar.js](:) <!-- links to ./foobar.js -->
```

