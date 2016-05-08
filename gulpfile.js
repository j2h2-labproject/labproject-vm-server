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

  var stream = gulp.src([JAVASCRIPT_PATH,])
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
  gulp.watch([JAVASCRIPT_PATH, '!node_modules/**', '!test/**'], function(event) {
  	console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
		console.log(colors.notice("\nRunning Linters\n"));
		gulp.src([event.path])
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
	});
});

gulp.task('default', ['watch_self', 'linter_watch'], function() {

});
