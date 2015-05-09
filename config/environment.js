/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'icarus',
    environment: environment,
    baseURL: '/',
    apiURL: 'localhost:5000',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    contentSecurityPolicy: {
      'default-src': "'none'",
      'script-src': "'self' 'unsafe-inline' http://cdn.mxpnl.com",
      'font-src': "'self'",
      'connect-src': "'self' http://api.mixpanel.com",
      'img-src': "'self'",
      'style-src': "'self' 'unsafe-inline",
      'frame-src': ""
    },

    // Mixpanel Config
    MIXPANEL_TOKEN: process.env.ICARUS_MIXPANEL_TOKEN,

    // Github OAuth Token
    GITHUB_CLIENT_ID: process.env.ICARUS_GITHUB_CLIENT_ID

  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;

    ENV.contentSecurityPolicy['connect-src'] += ' http://localhost:5000 ws://localhost:5000';
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.baseURL = '/';
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {

  }

  return ENV;
};
