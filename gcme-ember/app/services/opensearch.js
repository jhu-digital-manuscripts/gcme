import Service from '@ember/service';
import ENV from 'gcme-ember/config/environment';

const TIMEOUT_MS = 30_000;

export default class OpensearchService extends Service {
  // Indirection so tests / dev / production can override the endpoint by
  // mutating ENV.gcme.opensearch.
  get search_uri() {
    return ENV.gcme.opensearch;
  }

  // Issue a POST to the configured OpenSearch endpoint with the given
  // query body. Resolves with the parsed JSON response on a 2xx status;
  // rejects with an Error otherwise.
  async executeQuery(query) {
    const url = this.search_uri;

    if (typeof url !== 'string' || url.length === 0) {
      // missing / empty / non-string config rejects without
      // issuing any network call.
      throw new Error(
        'OpenSearch endpoint configuration is missing or invalid.',
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(query),
        signal: controller.signal,
      });
    } catch (err) {
      // network error or abort.
      throw new Error(`OpenSearch request failed: ${err.message}`);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      // non-2xx, message includes status and statusText.
      throw new Error(
        `OpenSearch request failed: ${response.status} ${response.statusText}`,
      );
    }

    try {
      return await response.json();
    } catch (err) {
      throw new Error(
        `OpenSearch response was not valid JSON: ${err.message}`,
      );
    }
  }

  // Build the completion-suggest query for the given field and prefix and
  // return an array of matched source objects, each annotated with
  // `_match` set to the suggestion text. Resolves with `[]` when the
  // response contains no suggestions.
  async complete(term, prefix) {
    const query = {
      suggest: {
        term_suggest: {
          prefix,
          completion: {
            field: `${term}.suggest`,
            size: 10,
          },
        },
      },
    };

    const result = await this.executeQuery(query);
    const options = result?.suggest?.term_suggest?.[0]?.options ?? [];

    return options.map((option) => ({
      ...(option._source ?? {}),
      _match: option.text,
    }));
  }
}
