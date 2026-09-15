ember-tracked-storage-polyfill
==============================================================================

Polyfills the tracked storage primitive from Ember/Glimmer.

```js
import { createStorage, getValue, setValue } from 'ember-tracked-storage-polyfill';

let storage = createStorage(true);

getValue(storage); // true

setValue(storage, false);

getValue(storage); // false
```

See the [RFC](https://github.com/emberjs/rfcs/blob/master/text/0669-tracked-storage-primitive.md)
for more details. Imports should be from the polyfill itself, _not_ the path
from Ember in the RFC:

```js
// right
import { createStorage, getValue, setValue } from 'ember-tracked-storage-polyfill';

// wrong
import { createStorage, getValue, setValue } from '@glimmer/tracking/primitives/storage';
```

The extra complexity required to polyfill the import path as it will be in Ember
itself is not compatible with Embroider, and generally not worth it. This import
path will begin re-exporting from Ember as soon as the real version is
available, making the transition seamless.

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.15 or above
* Ember CLI v3.20 or above
* Node.js v10 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-tracked-storage-polyfill
```


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
