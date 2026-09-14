import '../../../debug/index.js';
import calculateLocationDisplay from '../system/calculate-location-display.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../debug/lib/assert.js';

function assertReservedNamedArguments(env) {
  let moduleName = env.meta?.moduleName;
  return {
    name: 'assert-reserved-named-arguments',
    visitor: {
      // In general, we don't assert on the invocation side to avoid creating migration
      // hazards (e.g. using angle bracket to invoke a classic component that uses
      // `this.someReservedName`. However, we want to avoid leaking special internal
      // things, such as `__ARGS__`, so those would need to be asserted on both sides.

      AttrNode({
        name,
        loc
      }) {
        if (name === '@__ARGS__') {
          (isDevelopingApp() && true && assert(`${assertMessage(name)} ${calculateLocationDisplay(moduleName, loc)}`));
        }
      },
      HashPair({
        key,
        loc
      }) {
        if (key === '__ARGS__') {
          (isDevelopingApp() && true && assert(`${assertMessage(key)} ${calculateLocationDisplay(moduleName, loc)}`));
        }
      },
      PathExpression({
        original,
        loc
      }) {
        if (isReserved(original)) {
          (isDevelopingApp() && true && assert(`${assertMessage(original)} ${calculateLocationDisplay(moduleName, loc)}`));
        }
      }
    }
  };
}
const RESERVED = ['@arguments', '@args', '@block', '@else'];
function isReserved(name) {
  return RESERVED.indexOf(name) !== -1 || Boolean(name.match(/^@[^a-z]/));
}
function assertMessage(name) {
  return `'${name}' is reserved.`;
}

export { assertReservedNamedArguments as default };
