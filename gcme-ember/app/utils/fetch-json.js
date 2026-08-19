const TIMEOUT_MS = 30_000;

/**
 * Fetch a URL and parse its body as JSON.
 *
 * Aborts the request after 30 seconds. On any failure (network error, abort,
 * non-2xx response, or invalid JSON body), rejects with an Error whose message
 * includes the requested URL and the underlying failure cause.
 *
 * @param {string} url The URL to fetch.
 * @returns {Promise<unknown>} The parsed JSON body.
 */
export default async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    throw new Error(`Request to ${url} failed: ${err.message}`);
  }

  clearTimeout(timer);

  if (!response.ok) {
    throw new Error(
      `Request to ${url} failed: ${response.status} ${response.statusText}`
    );
  }

  try {
    return await response.json();
  } catch (err) {
    throw new Error(`Request to ${url} failed: ${err.message}`);
  }
}
