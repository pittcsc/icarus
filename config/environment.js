/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'icarus',
    environment: environment,
    firebase: process.env.ICARUS_FIREBASE_URL,
    baseURL: '/',
    locationType: 'hash',
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
      'script-src': "'self' 'unsafe-inline' http://cdn.mxpnl.com https://*.firebaseio.com",
      'font-src': "'self' http://fonts.gstatic.com",
      'connect-src': "'self' http://api.mixpanel.com wss://*.firebaseio.com",
      'img-src': "'self'",
      'style-src': "'self' 'unsafe-inline http://fonts.googleapis.com",
      'frame-src': "https://*.firebaseio.com"
    },

    // Mixpanel Config
    MIXPANEL_ENABLE: false,
    MIXPANEL_TOKEN: process.env.ICARUS_MIXPANEL_TOKEN,
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
