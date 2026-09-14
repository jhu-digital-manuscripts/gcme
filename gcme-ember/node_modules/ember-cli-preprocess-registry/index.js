'use strict';

const debug = require('debug')('ember-cli:registry');

class Registry {
  constructor() {
    this.registry = {};
  }

  extensionsForType(type) {
    let registered = this.registeredForType(type);

    let extensions = registered
      .reduce((memo, plugin) => memo.concat(plugin.ext), [type])
      .filter(Boolean)
      .reduce((memo, ext) => {
        if (memo.indexOf(ext) === -1) {
          memo.push(ext);
        }

        return memo;
      }, []);

    debug('extensions for type %s: %s', type, extensions);

    return extensions;
  }

  load(type) {
    let plugins = this.registeredForType(type);

    debug('loading %s: available plugins %s;', type, plugins.map(p => p.name));

    return plugins;
  }

  registeredForType(type) {
    return this.registry[type] = this.registry[type] || [];
  }

  add(type, plugin) {
    let registered = this.registeredForType(type);

    debug('add type: %s, name: %s, extension:%s', type, plugin.name, plugin.ext);

    registered.push(plugin);
  }

  remove(type, pluginOrName) {
    let registered = this.registeredForType(type);
    let name, registeredIndex;

    if (typeof pluginOrName === 'object') {
      name = pluginOrName.name;
      registeredIndex = registered.indexOf(pluginOrName);
    } else {
      name = pluginOrName;
      for (let i = 0, l = registered.length; i < l; i++) {
        if (registered[i].name === name) {
          registeredIndex = i;
        }
      }
    }

    debug('remove type: %s, name: %s', type, name);

    if (registeredIndex > -1) {
      registered.splice(registeredIndex, 1);
    }
  }
}

module.exports = Registry;
