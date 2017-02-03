# Changelog

## 0.4.15

* Add property `word-break: break-all` in addition to `word-wrap: break-all`.

## 0.4.14

* Fix incorrect wrapping property on code, causing non-breakable code to extend into the comments pane.

## 0.4.13

* Changed the styling of headers and code formatting in the comments pane.

## 0.4.12

* Added support for ignoring comments with a matching string at the
  start (resolve [issue #13](https://github.com/zlsa/indoc/issues/13))
* Added language TeX

## 0.4.11

* Fix missing `index.html` when no `readme` file is specified

## 0.4.10

* Added language OpenSCAD

## 0.4.9

* Fix multi-line comment parsing.

## 0.4.8

* Remove anti-scroll "feature"

## 0.4.7

* Removed translate transition on file menu
* Remove default link title

## 0.4.6

* Fixed C++ and H++ colors.

## 0.4.5

* Fixed silly bug with project links on non-index pages.

## 0.4.4

* Rust and HPP files are recognized.
* Project link support.

## 0.4.3

* Dropdown image is included in `package.json` file list.

## 0.4.2

* Version number is always next to the project name.
* File list scrollbar only appears when needed

## 0.4.1

* Use Google Fonts instead of self-hosting. (Will still work offline but with non-optimal fonts.)
* Add support for header hashes in project file links.
* Fix code block styling in comment area

## 0.4.0

Major update.

* Switching over to ES6 classes. (Don't worry, the old API still works.)
* Switched the template engine from `handlebars` to `hogan.js` for (supposedly) faster build times
* Rewrote file list style. More reliable and simpler.
