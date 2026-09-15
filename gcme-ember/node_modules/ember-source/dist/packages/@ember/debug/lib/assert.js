import { isDevelopingApp } from '@embroider/macros';

let assert = () => {};
function setAssert(implementation) {
  assert = implementation;
  return implementation;
}
if (isDevelopingApp()) {
  /**
    Verify that a certain expectation is met, or throw a exception otherwise.
     This is useful for communicating assumptions in the code to other human
    readers as well as catching bugs that accidentally violates these
    expectations.
     Assertions are removed from production builds, so they can be freely added
    for documentation and debugging purposes without worries of incuring any
    performance penalty. However, because of that, they should not be used for
    checks that could reasonably fail during normal usage. Furthermore, care
    should be taken to avoid accidentally relying on side-effects produced from
    evaluating the condition itself, since the code will not run in production.
     ```javascript
    import { assert } from '@ember/debug';
     // Test for truthiness
    assert('Must pass a string', typeof str === 'string');
     // Fail unconditionally
    assert('This code path should never be run');
    ```
     @method assert
    @static
    @for @ember/debug
    @param {String} description Describes the expectation. This will become the
      text of the Error thrown if the assertion fails.
    @param {any} condition Must be truthy for the assertion to pass. If
      falsy, an exception will be thrown.
    @public
    @since 1.0.0
  */

  function assert(desc, test) {
    if (!test) {
      throw new Error(`Assertion Failed: ${desc}`);
    }
  }
  setAssert(assert);
}

export { assert, setAssert };
