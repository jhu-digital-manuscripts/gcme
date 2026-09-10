import config from 'gcme-ember/config/environment';

/**
 * DataLoader handles fetching and caching of the four JSON data files
 * required by the localsearch service.
 *
 * Lifecycle states:
 *   idle → loading → ready | failed
 *
 * - On first call to `ensureLoaded()`, transitions to `loading` and fetches
 *   all four files in parallel with a 30-second timeout.
 * - Concurrent callers queue behind the same in-flight promise.
 * - On success, transitions to `ready` and caches the result.
 * - On failure, rejects all queued callers and resets to `idle` so the
 *   next call retries.
 */

const TIMEOUT_MS = 30000;

const DATA_FILES = [
  { key: 'lines', path: 'line.json' },
  { key: 'wordDict', path: 'word_dict.json' },
  { key: 'lemmaDict', path: 'lemma_dict.json' },
  { key: 'lemmaTagDict', path: 'lemma_tag_dict.json' },
];

export default class DataLoader {
  /** @type {'idle' | 'loading' | 'ready' | 'failed'} */
  _state = 'idle';

  /** @type {Promise<{lines, wordDict, lemmaDict, lemmaTagDict}> | null} */
  _loadPromise = null;

  /** @type {{lines, wordDict, lemmaDict, lemmaTagDict} | null} */
  _cachedData = null;

  /**
   * Returns a promise that resolves with the loaded data.
   *
   * If data is already loaded, resolves immediately. If a load is in
   * progress, returns the same in-flight promise. If idle (or previously
   * failed), starts a new load attempt.
   *
   * @returns {Promise<{lines: Array, wordDict: Array, lemmaDict: Array, lemmaTagDict: Array}>}
   */
  ensureLoaded() {
    if (this._state === 'ready') {
      return Promise.resolve(this._cachedData);
    }

    if (this._state === 'loading') {
      return this._loadPromise;
    }

    // State is 'idle' or 'failed' — start a new load attempt
    this._state = 'loading';
    this._loadPromise = this._performLoad();

    return this._loadPromise;
  }

  /**
   * Returns the current lifecycle state.
   * @returns {'idle' | 'loading' | 'ready' | 'failed'}
   */
  get state() {
    return this._state;
  }

  /**
   * Fetches all four data files in parallel with a timeout.
   * On success, caches data and transitions to 'ready'.
   * On failure, rejects and resets to 'idle' for retry.
   *
   * @returns {Promise<{lines, wordDict, lemmaDict, lemmaTagDict}>}
   * @private
   */
  async _performLoad() {
    const controller = new AbortController();
    const { signal } = controller;

    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const results = await Promise.all(
        DATA_FILES.map(({ key, path }) =>
          this._fetchFile(path, signal).then((data) => ({ key, data }))
        )
      );

      clearTimeout(timeoutId);

      const loaded = {};
      for (const { key, data } of results) {
        loaded[key] = data;
      }

      this._cachedData = loaded;
      this._state = 'ready';
      this._loadPromise = null;

      return loaded;
    } catch (error) {
      clearTimeout(timeoutId);

      this._state = 'idle';
      this._loadPromise = null;
      this._cachedData = null;

      throw error;
    }
  }

  /**
   * Fetches a single JSON file from the public directory.
   *
   * @param {string} filename The filename to fetch (relative to public root).
   * @param {AbortSignal} signal AbortSignal for timeout cancellation.
   * @returns {Promise<any>} Parsed JSON data.
   * @private
   */
  async _fetchFile(filename, signal) {
    const url = `${config.rootURL}${filename}`;
    let response;
    try {
      response = await fetch(url, { signal });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Data loading timed out');
      }
      throw new Error(`Failed to load ${filename}: ${error.message}`);
    }

    if (!response.ok) {
      throw new Error(
        `Failed to load ${filename}: HTTP ${response.status} ${response.statusText}`
      );
    }

    try {
      return await response.json();
    } catch {
      throw new Error(`Failed to parse ${filename}`);
    }
  }
}
