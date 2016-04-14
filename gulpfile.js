var gulp = require("gulp");
var jshint = require("gulp-jshint");
var eslint = require("gulp-eslint");
var exec = require('child_process').exec;
var clicolor = require("cli-color");

var colors = {
	error: clicolor.redBright,
	warning: clicolor.xterm(202),
	debug: clicolor.cyanBright,
	notice: clicolor.blueBright,
	good: clicolor.greenBright
};

var JAVASCRIPT_PATH = '**/*.js';

gulp.task('watch_self', function() {
  var watcher = gulp.watch("./gulpfile.js");
  watcher.on('change', function(event) {
    console.log(colors.warning("Change in gulpfile!"));
    process.exit();
  });
});

gulp.task('run_eslint', ['run_jshint'], function() {
  console.log(colors.notice("\nRunning ESLint\n"));

  var stream = gulp.src([JAVASCRIPT_PATH,'!node_modules/**'])
       .pipe(eslint())
       .pipe(eslint.format())
       .pipe(eslint.failAfterError());
  return stream;

});

gulp.task('run_jshint', function() {
  console.log(colors.notice("\nRunning JSLint\n"));
  var stream =  gulp.src([JAVASCRIPT_PATH,'!node_modules/**', '!**/test/**'])
  .pipe(jshint())
  .pipe(jshint.reporter('default'));
  return stream;
});

gulp.task('linter_watch', function() {
  gulp.watch(JAVASCRIPT_PATH, ['run_eslint']);
});

gulp.task('default', ['watch_self', 'linter_watch'], function() {

});
