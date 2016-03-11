
// Parse arguments with `yargs`.
var argv = require('yargs')
      .usage('Usage: $0 [options] file...')

// Require at least one input filename.
      .demand(1)

      .alias('v', 'version')
      .version(function() { return require('../package').version; })
      .describe('v', 'show version information')

      .help('h')
      .alias('h', 'help')

// No default README file to avoid ugly warnings.

      .option('r', {
        alias : 'readme',
        describe: 'Provide a README markdown file',
        type: 'string',
        nargs: 1,
        default: null
      })

// Again, no default here. (If no name is provided, `indoc` has its own defaults.)

      .option('n', {
        alias : 'name',
        describe: 'The name of the project',
        type: 'string',
        nargs: 1,
        default: null
      })

// The output directory.

      .option('o', {
        alias : 'output',
        describe: 'The output directory',
        type: 'string',
        nargs: 1,
        default: 'docs'
      })

// The owners of the project; for example, "Mousetrap Contributors" or
// "Linus Torvalds et. al."

      .option('owners', {
        describe: 'The owners of the project',
        type: 'string',
        nargs: 1,
        default: null
      })

      .epilog('Copyright 2016')
      .argv;

// `winston`, for logging.
var winston = require('winston');

// Set up the logger.

var logger = new winston.Logger({
  level: 'info',
  transports: [
    
    // I have no idea what this really does but I copy-pasted it, and
    // it works and looks pretty, so I'm not complaining.
    
    new (winston.transports.Console)({
      colorize: true
    })
  ]
});

// Require the `indoc` library. Stuff is getting serious.

var indoc = require('../lib/main');

////////////////////////////////////////////////

// And create the project with all of the above command-line options.
var project = indoc.project.create({
  
  // This is easy thanks to `yargs`. Thanks, matey!
  
  files: argv._,
  readme: argv.r,
  name: argv.n,
  output: argv.o,
  owners: argv.owners
  
});

// Called when we have a duplicate file (i.e. ['foo.js',
// 'foo.js']). `indoc` automatically ignores it, but the event lets us
// print out a warning message.

project.on('duplicate-file', function(data) {
  logger.log('warn', 'Duplicate file "' + data.filename + '"');
});

// Called when a template can't be read. This is probably going to
// crash things later on. FIXME!!!

project.on('template-err', function(data) {
  logger.log('warn', 'Could not read template "' + data.filename + '"');
});

// Called when the provided README file can't be opened. Instead of
// failing, "No README provided" is used as a replacement for the actual
// README file.

project.on('readme-err', function(data) {
  logger.log('warn', 'Could not open README file "' + data.filename + '"');
});

// Called when a file (from the `public/` directory) cannot be
// copied. This really shouldn't ever happen unless I screwed up and
// told it to copy a file that doesn't exist.

project.on('copy-err', function(data) {
  logger.log('warn', 'Could not copy file "' + data.src + '" to "' + data.dest + '"');
});

// Called for every file that has been generated.

project.on('run-file-complete', function(data) {
  
  if(data.err) {
    logger.log('error', 'Could not generate "' + data.data.filename + '"');
    return;
  }
  
  logger.log('info', 'Generated "' + data.data.filename + '"');
});

// And we run the project, finally! This parses all of the files, then
// creates the generated files, as well as copying over all of the
// CSS/JS/fonts required to display the resulting page. The callback
// is called when every file is fully generated.

project.run(function(err, data) {

  var total = data.total;
  var errors = data.errors;
  var number = total;
  
  if(errors) number = (total - errors) + '/' + total;
  
  // See you all!
  
  logger.log('info', 'Successfully generated ' + number + ' file' + (total == 1 ? '' : 's'));

});
