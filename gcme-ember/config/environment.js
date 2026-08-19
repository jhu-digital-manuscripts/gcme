'use strict';

module.exports = function (environment) {
  // Default to /gcme/ for GitHub Pages deployment; override with GCME_ROOT_URL.
  // Must start and end with '/'.
  let rootURL = process.env.GCME_ROOT_URL || '/gcme/';
  if (!rootURL.startsWith('/')) {
    rootURL = '/' + rootURL;
  }
  if (!rootURL.endsWith('/')) {
    rootURL = rootURL + '/';
  }

  const ENV = {
    modulePrefix: 'gcme-ember',
    environment,
    rootURL,
    locationType: 'history',
    EmberENV: {
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false,
      },
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      },
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },
  };

  // searchBackend selects how searches are answered: 'localsearch' answers them
  // in the browser from the static JSON data files, 'opensearch' queries the
  // endpoint configured above.
  ENV.gcme = {
    opensearch: process.env.GCME_OPENSEARCH || 'http://localhost:9200/_search',
    searchBackend: process.env.GCME_SEARCH_BACKEND || 'localsearch',
  };

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  return ENV;
};
