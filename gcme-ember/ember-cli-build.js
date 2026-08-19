'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    fingerprint: { enabled: true },
    'ember-bootstrap': {
      importBootstrapCSS: false,
      insertEmberWormholeElementToDom: false
    },
    'ember-cli-terser': { enabled: true },
    autoImport: {
      // fast-check is a test-only PBT library; ember-auto-import resolves
      // it from devDependencies at build time so test bundles can `import`
      // it directly without an explicit `app.import`.
    },
  });

  app.import('node_modules/bootstrap/dist/css/bootstrap.css');
  app.import('node_modules/ember-basic-dropdown/dist/vendor/ember-basic-dropdown.css');
  app.import('node_modules/ember-power-select/dist/vendor/ember-power-select.css');

  return app.toTree();
};
