var gulp    = require('gulp'),
    uglify  = require('gulp-uglify'),
    rename  = require('gulp-rename');


gulp.task('default', function() {
    gulp.src('src/*.js')
        .pipe(gulp.dest('dist'))
        .pipe(uglify())
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest('dist'))
});