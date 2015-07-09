/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var pickFiles = require('broccoli-static-compiler');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
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

  return app.toTree(fontawesome);
};
