'use strict';

const path = require('path');
const Registry = require('./');
const debug = require('debug')('ember-cli:preprocessors');

/**
  Invokes the `setupRegistryForEachAddon('parent', registry)` hook for each of the parent objects addons.

  @private
  @method setupRegistryForEachAddon
  @param {Registry} registry the registry being setup
  @param {Addon|EmberApp} parent the parent object of the registry being setup. Will be an addon for nested
    addons, or the `EmberApp` for addons in the project directly.
*/
function setupRegistryForEachAddon(registry, parent) {
  parent.initializeAddons();
  let addons = parent.addons || (parent.project && parent.project.addons);

  if (!addons) {
    return;
  }

  addons.forEach(addon => {
    if (addon.setupPreprocessorRegistry) {
      addon.setupPreprocessorRegistry('parent', registry);
    }
  });
}

/**
  Invokes the `setupPreprocessorRegistry` hook for a given addon. The `setupPreprocessorRegistry` will be
  invoked first on the addon itself (with the first argument of `'self'`), and then on each nested addon
  (with the first argument of `'parent'`).

  @private
  @method setupRegistry
  @param {Addon|EmberApp}
*/
module.exports.setupRegistry = function(appOrAddon) {
  let registry = appOrAddon.registry;
  if (appOrAddon.setupPreprocessorRegistry) {
    appOrAddon.setupPreprocessorRegistry('self', registry);
  }
  setupRegistryForEachAddon(registry, appOrAddon);
};

/**
  Creates a Registry instance, and prepopulates it with a few static default
  preprocessors.

  @private
  @method defaultRegistry
*/
module.exports.defaultRegistry = function() {
  let registry = new Registry();

  return registry;
};

/**
  Returns true if the given path would be considered of a specific type.

  For example:

  ```
  isType('somefile.js', 'js', addon); // => true
  isType('somefile.css', 'css', addon); // => true
  isType('somefile.blah', 'css', addon); // => false
  isType('somefile.sass', 'css', addon); // => true if a sass preprocessor is available
  ```
  @private
  @method isType
  @param {String} file the path to check
  @param {String} type the type to compare with
  @param {Object} registryOwner the object whose registry we should search
*/
module.exports.isType = function(file, type, registryOwner) {
  let extension = path.extname(file).replace('.', '');

  if (extension === type) { return true; }

  if (registryOwner.registry.extensionsForType(type).indexOf(extension) > -1) {
    return true;
  }
};

module.exports.preprocessMinifyCss = function(tree, options) {
  let plugins = options.registry.load('minify-css');

  if (plugins.length > 1) {
    throw new Error('You cannot use more than one minify-css plugin at once.');
  }

  return processPlugins(plugins, arguments);
};

module.exports.preprocessCss = function(tree, inputPath, outputPath, options) {
  let plugins = options.registry.load('css');

  if (plugins.length === 0) {
    const funnel = require('broccoli-funnel');

    return funnel(tree, {
      srcDir: inputPath,

      getDestinationPath(relativePath) {
        if (options.outputPaths) {
          // options.outputPaths is not present when compiling
          // an addon's styles
          let path = relativePath.replace(/\.css$/, '');

          // is a rename rule present?
          if (options.outputPaths[path]) {
            return options.outputPaths[path];
          }
        }

        return `${outputPath}/${relativePath}`;
      },
    });
  }

  return processPlugins(plugins, arguments);
};

module.exports.preprocessTemplates = function(/* tree */) {
  let options = arguments[arguments.length - 1];
  let plugins = options.registry.load('template');

  debug('plugins found for templates: %s', plugins.map(p => p.name));

  if (plugins.length === 0) {
    throw new Error('Missing template processor');
  }

  return processPlugins(plugins, arguments);
};

module.exports.preprocessJs = function(/* tree, inputPath, outputPath, options */) {
  let options = arguments[arguments.length - 1];
  let plugins = options.registry.load('js');
  let tree = arguments[0];

  if (plugins.length === 0) { return tree; }

  return processPlugins(plugins, arguments);
};

function processPlugins(plugins, args) {
  args = Array.prototype.slice.call(args);
  let tree = args.shift();

  plugins.forEach(plugin => {
    debug('processing %s', plugin.name);
    tree = plugin.toTree.apply(plugin, [tree].concat(args));
  });

  return tree;
}
