# ember-cli-preprocessor-registry

Used by Ember CLI to provide a registry of preprocessors. The main types
used throughout the system are `css`, `template`, `js`.

## Addon Usage

You can access both your own addon's and your parent's (whichever item is including you)
registry via the `setupPreprocessorRegistry` hook in your addon's `index.js`.

Example:

```js
module.exports = {
  name: 'special-js-sauce',
  
  setupPreprocessorRegistry(type, registry) {
    if (type !== 'parent') { return; }

    registry.add('js', {
      name: 'special-js-sauce-preprocessor',
      toTree() {
        // do your thing here....
      }
    });
  }
}
```

## API

### `Registry.prototype.add(type: String, plugin: Plugin)`

Adds the provided plugin to the registry for the type specified.

Example:

```js
class SpecialSauce {
  get name() { return 'special-sauce'; }

  toTree(tree) {
    // return new tree after processing
  }
}

registry.add('js', new SpecialSauce);
```

### `Registry.prototype.load(type: String): Plugin[]`

Returns an array of all plugins that are registered for a given type.

### `Registry.prototype.extensionsForType(type: String): string[]`

Returns an array of all known extensions for a given type.

### `Registry.prototype.remove(type: String, plugin: Plugin)`

Removes the provided plugin from the specified type listing.

## Running Tests

```bash
npm install
npm test
```
