import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import ENV from 'gcme-ember/config/environment';
import { setupStubbedFetch } from '../../helpers/stub-fetch';

// Unit tests for OpenSearch service.
//
// Validates: Requirements 9.4, 9.5
//   (which in turn cover Requirements 4.1, 4.2, 4.3, 4.4, 4.7, 4.9, 8.4)

module('Unit | Service | opensearch', function (hooks) {
  setupTest(hooks);
  setupStubbedFetch(hooks);

  test('executeQuery POSTs JSON to search_uri and resolves with the parsed response body', async function (assert) {
    const responseBody = {
      hits: { total: 2, hits: [{ _source: { id: 'a' } }, { _source: { id: 'b' } }] },
    };
    const stub = this.stubFetch({ status: 200, body: responseBody });

    const service = this.owner.lookup('service:opensearch');
    const query = { query: { match_all: {} }, from: 0, size: 25 };

    const result = await service.executeQuery(query);

    assert.deepEqual(result, responseBody, 'resolves with the parsed JSON response');
    assert.strictEqual(stub.calls.length, 1, 'fetch is called exactly once');
    assert.strictEqual(
      stub.lastCall.url,
      ENV.gcme.opensearch,
      'POSTs to the configured search_uri',
    );
    assert.strictEqual(stub.lastCall.method, 'POST', 'uses POST');
    assert.strictEqual(
      stub.lastCall.headers['Content-Type'],
      'application/json; charset=utf-8',
      'sets Content-Type to application/json; charset=utf-8',
    );
    assert.strictEqual(
      stub.lastCall.body,
      JSON.stringify(query),
      'body is the JSON-stringified query',
    );
  });

  test('executeQuery rejects with status and statusText when the response is 5xx', async function (assert) {
    this.stubFetch({ status: 503, statusText: 'Service Unavailable', body: {} });

    const service = this.owner.lookup('service:opensearch');

    try {
      await service.executeQuery({ q: 1 });
      assert.ok(false, 'expected executeQuery to reject');
    } catch (err) {
      assert.ok(err instanceof Error, 'rejects with an Error');
      assert.ok(
        /503/.test(err.message),
        `error message includes the status code (got: ${err.message})`,
      );
      assert.ok(
        /Service Unavailable/.test(err.message),
        `error message includes the status text (got: ${err.message})`,
      );
    }
  });

  test('executeQuery rejects when fetch reports a network error', async function (assert) {
    const networkError = new TypeError('Failed to fetch');
    this.stubFetch({ networkError });

    const service = this.owner.lookup('service:opensearch');

    try {
      await service.executeQuery({ q: 1 });
      assert.ok(false, 'expected executeQuery to reject');
    } catch (err) {
      assert.ok(err instanceof Error, 'rejects with an Error');
      assert.ok(
        /Failed to fetch/.test(err.message),
        `error message includes the network failure cause (got: ${err.message})`,
      );
    }
  });

  test('executeQuery rejects when the response body cannot be parsed as JSON', async function (assert) {
    this.stubFetch({ status: 200, parseFails: true });

    const service = this.owner.lookup('service:opensearch');

    try {
      await service.executeQuery({ q: 1 });
      assert.ok(false, 'expected executeQuery to reject');
    } catch (err) {
      assert.ok(err instanceof Error, 'rejects with an Error');
      assert.ok(
        /JSON/i.test(err.message),
        `error message indicates a JSON parse failure (got: ${err.message})`,
      );
    }
  });

  test('executeQuery rejects without issuing a fetch when search_uri is missing', async function (assert) {
    const stub = this.stubFetch({ status: 200, body: {} });

    const service = this.owner.lookup('service:opensearch');
    // Override the `search_uri` getter on this instance so the service
    // sees a missing endpoint while the rest of ENV is untouched.
    Object.defineProperty(service, 'search_uri', {
      value: undefined,
      configurable: true,
    });

    try {
      await service.executeQuery({ q: 1 });
      assert.ok(false, 'expected executeQuery to reject when search_uri is missing');
    } catch (err) {
      assert.ok(err instanceof Error, 'rejects with an Error');
      assert.ok(
        /endpoint/i.test(err.message) || /missing/i.test(err.message),
        `error message indicates the endpoint is missing (got: ${err.message})`,
      );
    }

    assert.strictEqual(
      stub.calls.length,
      0,
      'no fetch call is issued when search_uri is missing',
    );
  });

  test('complete("word", prefix) targets the word.suggest completion field', async function (assert) {
    const stub = this.stubFetch({
      status: 200,
      body: { suggest: { term_suggest: [{ options: [] }] } },
    });

    const service = this.owner.lookup('service:opensearch');
    await service.complete('word', 'lo');

    assert.strictEqual(stub.calls.length, 1, 'fetch is called exactly once');
    const body = JSON.parse(stub.lastCall.body);
    assert.strictEqual(
      body.suggest.term_suggest.completion.field,
      'word.suggest',
      'completion field is word.suggest',
    );
    assert.strictEqual(
      body.suggest.term_suggest.prefix,
      'lo',
      'prefix is forwarded to the suggest query',
    );
  });

  test('complete("lemma", prefix) targets the lemma.suggest completion field', async function (assert) {
    const stub = this.stubFetch({
      status: 200,
      body: { suggest: { term_suggest: [{ options: [] }] } },
    });

    const service = this.owner.lookup('service:opensearch');
    await service.complete('lemma', 'kn');

    assert.strictEqual(stub.calls.length, 1, 'fetch is called exactly once');
    const body = JSON.parse(stub.lastCall.body);
    assert.strictEqual(
      body.suggest.term_suggest.completion.field,
      'lemma.suggest',
      'completion field is lemma.suggest',
    );
    assert.strictEqual(
      body.suggest.term_suggest.prefix,
      'kn',
      'prefix is forwarded to the suggest query',
    );
  });

  test('complete("lemma_tag", prefix) targets the lemma_tag.suggest completion field', async function (assert) {
    const stub = this.stubFetch({
      status: 200,
      body: { suggest: { term_suggest: [{ options: [] }] } },
    });

    const service = this.owner.lookup('service:opensearch');
    await service.complete('lemma_tag', 'tr');

    assert.strictEqual(stub.calls.length, 1, 'fetch is called exactly once');
    const body = JSON.parse(stub.lastCall.body);
    assert.strictEqual(
      body.suggest.term_suggest.completion.field,
      'lemma_tag.suggest',
      'completion field is lemma_tag.suggest',
    );
    assert.strictEqual(
      body.suggest.term_suggest.prefix,
      'tr',
      'prefix is forwarded to the suggest query',
    );
  });
});
