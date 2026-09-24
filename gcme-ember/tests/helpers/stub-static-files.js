/**
 * Stub `window.fetch` for the static files the routes load.
 *
 * The text and search routes fetch `text-powersel.json` and
 * `group-title.json`; the corpus data itself is installed directly on the
 * corpus service by `setupCorpus`, so no request is made for it.
 */
import { TEXT_POWERSEL, GROUP_TITLES } from './corpus-fixture';

/** Map from file name to the body served for it. */
const FILES = {
  'text-powersel.json': TEXT_POWERSEL,
  'group-title.json': GROUP_TITLES,
};

/**
 * Install the stub for the duration of each test in a module.
 *
 * @param {Object} hooks QUnit nested-`module` hooks object.
 */
export function setupStaticFiles(hooks) {
  hooks.beforeEach(function () {
    this._originalFetch = window.fetch;
    this.staticFileRequests = [];

    window.fetch = (url) => {
      this.staticFileRequests.push(url);
      const name = Object.keys(FILES).find((file) => String(url).endsWith(file));

      if (!name) {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.reject(new SyntaxError('not JSON')),
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(FILES[name]),
      });
    };
  });

  hooks.afterEach(function () {
    window.fetch = this._originalFetch;
    delete this._originalFetch;
  });
}
