/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var pickFiles = require('broccoli-static-compiler');

var app = new EmberApp({
  sassOptions: {
    includePaths: [
      'bower_components/breakpoint-sass/stylesheets'
    ]
  }
});

// Import FontAwesome
app.import("vendor/font-awesome.css");
var fontawesome = pickFiles('bower_components/fontawesome', {
  srcDir: '/fonts',
  files: ['**.*'],
  destDir: 'assets/fonts',
});

module.exports = app.toTree(fontawesome);
