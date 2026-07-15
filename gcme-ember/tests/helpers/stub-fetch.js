/**
 * Stubs `window.fetch` for unit tests of `OpensearchService` and any
 * other code that performs HTTP through the native Fetch API.
 *
 * Usage (manual teardown):
 *
 *   import { stubFetchOnce } from '../../helpers/stub-fetch';
 *
 *   const restore = stubFetchOnce({ status: 200, body: { hits: {} } });
 *   try {
 *     await service.executeQuery({ a: 1 });
 *     assert.strictEqual(restore.lastCall.method, 'POST');
 *     assert.strictEqual(
 *       restore.lastCall.headers['Content-Type'],
 *       'application/json; charset=utf-8'
 *     );
 *     assert.strictEqual(restore.lastCall.body, JSON.stringify({ a: 1 }));
 *   } finally {
 *     restore();
 *   }
 *
 * Usage (auto teardown via QUnit `hooks`):
 *
 *   module('...', function (hooks) {
 *     setupTest(hooks);
 *     setupStubbedFetch(hooks);
 *
 *     test('...', async function (assert) {
 *       const stub = this.stubFetch({ status: 503, statusText: 'X' });
 *       // ...assertions against `stub.lastCall`...
 *     });
 *   });
 */

/**
 * Replace `window.fetch` with a stub that resolves with a single response
 * shape (or rejects with `networkError`) and records every call.
 *
 * @param {object} [options]
 * @param {number} [options.status=200] HTTP status reported on the stubbed Response.
 * @param {string} [options.statusText='OK'] HTTP status text.
 * @param {*} [options.body={}] Value the stubbed `response.json()` resolves with.
 * @param {boolean} [options.parseFails=false] When true, `response.json()` rejects with a `SyntaxError`.
 * @param {Error|null} [options.networkError=null] When set, `fetch` rejects with this error.
 * @returns {Function & { calls: Array, lastCall: object|null }}
 *   Teardown function that restores the original `window.fetch`. The
 *   teardown also exposes `calls` (every recorded invocation) and
 *   `lastCall` (the most recent invocation, or `null`). Each recorded
 *   call has the shape `{ url, method, headers, body }`.
 */
export function stubFetchOnce({
  status = 200,
  statusText = 'OK',
  body = {},
  parseFails = false,
  networkError = null,
} = {}) {
  const original = window.fetch;
  const calls = [];

  window.fetch = function stubbedFetch(url, opts = {}) {
    calls.push({
      url,
      method: opts.method || 'GET',
      headers: opts.headers || {},
      body: opts.body,
    });

    if (networkError) {
      return Promise.reject(networkError);
    }

    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText,
      json() {
        return parseFails
          ? Promise.reject(new SyntaxError('Unexpected token in JSON'))
          : Promise.resolve(body);
      },
    });
  };

  const teardown = function () {
    window.fetch = original;
  };
  teardown.calls = calls;
  Object.defineProperty(teardown, 'lastCall', {
    get() {
      return calls.length === 0 ? null : calls[calls.length - 1];
    },
  });

  return teardown;
}

/**
 * Thin QUnit `module` hooks integration that auto-restores `window.fetch`
 * after each test.
 *
 * Adds `this.stubFetch(options)` to the test context. Calling it installs
 * a fresh `stubFetchOnce` stub and returns the teardown (which carries
 * `calls` / `lastCall`). The teardown is run automatically in `afterEach`.
 *
 * @param {object} hooks QUnit nested-`module` hooks object.
 */
export function setupStubbedFetch(hooks) {
  hooks.beforeEach(function () {
    let teardown = null;

    this.stubFetch = (options) => {
      if (teardown) {
        teardown();
      }
      teardown = stubFetchOnce(options);
      return teardown;
    };

    this._restoreStubbedFetch = () => {
      if (teardown) {
        teardown();
        teardown = null;
      }
    };
  });

  hooks.afterEach(function () {
    if (typeof this._restoreStubbedFetch === 'function') {
      this._restoreStubbedFetch();
    }
    delete this._restoreStubbedFetch;
    delete this.stubFetch;
  });
}
