import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';
import { TEXT_POWERSEL, GROUP_TITLES } from '../../helpers/corpus-fixture';

/** Records the transitions a controller asks for. */
class StubRouter extends Service {
  transitions = [];
  replacements = [];

  transitionTo(route, options) {
    this.transitions.push({ route, options });
  }

  replaceWith(route, options) {
    this.replacements.push({ route, options });
  }
}

module('Unit | Controller | search', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:router', StubRouter);
    this.controller = this.owner.lookup('controller:search');
    this.router = this.owner.lookup('service:router');
    this.controller.model = {
      restrictData: TEXT_POWERSEL,
      groupTitleMap: GROUP_TITLES,
    };
  });

  test('it exists', function (assert) {
    assert.ok(this.controller);
  });

  test('the committed search is read from the query parameters', function (assert) {
    const controller = this.controller;
    controller.words = 'god,he%2C';
    controller.lemmas = 'mouen';
    controller.tags = 'mouen@v3%25pr_1';
    controller.restrict = 'GP,KnT';

    assert.deepEqual(controller.wordList, ['god', 'he,'], 'escaped commas decode');
    assert.deepEqual(controller.lemmaList, ['mouen']);
    assert.deepEqual(controller.taggedLemmaList, ['mouen@v3%pr_1']);
    assert.deepEqual(controller.restrictList, ['GP', 'KnT']);
  });

  test('page and size are clamped', function (assert) {
    const controller = this.controller;

    assert.strictEqual(controller.pageNumber, 1, 'the default page');
    assert.strictEqual(controller.pageSize, 25, 'the default size');

    controller.page = '3';
    assert.strictEqual(controller.pageNumber, 3);
    controller.page = '0';
    assert.strictEqual(controller.pageNumber, 1);

    controller.size = 500;
    assert.strictEqual(controller.pageSize, 100);
    controller.size = 0;
    assert.strictEqual(controller.pageSize, 1);
    controller.size = 'abc';
    assert.strictEqual(controller.pageSize, 25);
  });

  test('buildQuery turns the query parameters into the search query', function (assert) {
    const controller = this.controller;
    controller.words = 'god';
    controller.lemmas = 'mouen';
    controller.tags = 'mouen@v3%pr_1';
    controller.restrict = 'GP';
    controller.page = 2;
    controller.size = 10;

    const query = controller.buildQuery();

    assert.strictEqual(query.from, 10, 'page two of ten');
    assert.strictEqual(query.size, 10);
    assert.deepEqual(query.query.bool.must.bool.should, [
      { term: { text: 'god' } },
      { term: { lemma_text: 'mouen' } },
      { term: { lemma_tag_text: 'mouen@v3%pr_1' } },
    ]);
    assert.deepEqual(query.query.bool.filter, { terms: { group: ['GP'] } });
    assert.strictEqual(query.sort, undefined, 'unsorted by default');
  });

  test('buildQuery honours the all and sort parameters', function (assert) {
    const controller = this.controller;
    controller.words = 'god,may';
    controller.all = true;
    controller.sort = true;

    const query = controller.buildQuery();

    assert.deepEqual(query.query.bool.must.bool.must, [
      { term: { text: 'god' } },
      { term: { text: 'may' } },
    ]);
    assert.deepEqual(query.sort, [
      { id: 'asc' },
      { number: 'asc' },
      { raw_number: 'asc' },
    ]);
  });

  test('syncDraftsFromQueryParams rebuilds the form from the URL', function (assert) {
    const controller = this.controller;
    controller.words = 'god,he%2C';
    controller.lemmas = 'mouen';
    controller.tags = 'mouen@v3%25pr_1';
    controller.restrict = 'KnT,Unknown';
    controller.all = true;
    controller.sort = true;

    controller.syncDraftsFromQueryParams();

    assert.deepEqual(
      controller.draftWords.map((option) => option.word),
      ['god', 'he,'],
      'word chips show the word itself',
    );
    assert.deepEqual(
      controller.draftLemmas.map((option) => option.lemma),
      ['mouen'],
    );
    assert.deepEqual(
      controller.draftTaggedLemmas.map((option) => option.lemma_tag),
      ['mouen@v3%pr_1'],
    );
    assert.deepEqual(
      controller.draftRestrict.map((option) => option.label),
      ["Knight's Tale", 'Unknown'],
      'known ids get their dropdown option, unknown ids fall back on the id',
    );
    assert.true(controller.draftAll);
    assert.true(controller.draftSort);
  });

  test('draftQueryParams encodes the form for the URL', function (assert) {
    const controller = this.controller;
    controller.draftWords = [{ word: 'he,', _match: 'he,' }];
    controller.draftLemmas = [{ lemma: 'mouen', _match: 'mouen' }];
    controller.draftTaggedLemmas = [
      { lemma_tag: 'mouen@v3%pr_1', _match: 'mouen@v3%pr_1' },
    ];
    controller.draftRestrict = [{ id: 'GP', label: 'General Prologoue' }];
    controller.draftAll = true;

    assert.deepEqual(controller.draftQueryParams(), {
      words: 'he%2C',
      lemmas: 'mouen',
      tags: 'mouen@v3%25pr_1',
      restrict: 'GP',
      all: true,
      sort: false,
      page: 1,
      size: 25,
    });
  });

  test('submitSearch transitions to the search URL', function (assert) {
    const controller = this.controller;
    controller.draftWords = [{ word: 'god', _match: 'god' }];

    controller.submitSearch();

    assert.strictEqual(this.router.transitions.length, 1);
    assert.strictEqual(this.router.transitions[0].route, 'search');
    assert.strictEqual(this.router.transitions[0].options.queryParams.words, 'god');
    assert.strictEqual(controller.searchError, null);
  });

  test('submitSearch reports an empty query without transitioning', function (assert) {
    this.controller.submitSearch();

    assert.strictEqual(this.router.transitions.length, 0);
    assert.strictEqual(
      this.controller.searchError,
      'Enter at least one word, headword, or tagged headword.',
    );
  });

  test('paging replaces the current history entry', function (assert) {
    const controller = this.controller;
    controller.words = 'god';
    controller.result = { hits: { total: { value: 60 }, hits: [] } };
    controller.page = 2;

    controller.nextPage();
    assert.deepEqual(this.router.replacements[0].options.queryParams, { page: 3 });

    controller.prevPage();
    assert.deepEqual(this.router.replacements[1].options.queryParams, { page: 1 });
  });

  test('paging does nothing at the boundaries', function (assert) {
    const controller = this.controller;
    controller.words = 'god';
    controller.result = { hits: { total: { value: 10 }, hits: [] } };

    controller.prevPage();
    controller.nextPage();

    assert.strictEqual(this.router.replacements.length, 0);
  });

  test('clearQuery empties the form and the URL', function (assert) {
    const controller = this.controller;
    controller.draftWords = [{ word: 'god', _match: 'god' }];
    controller.result = { hits: { total: { value: 1 }, hits: [] } };

    controller.clearQuery();

    assert.strictEqual(controller.draftWords, null);
    assert.strictEqual(controller.result, null);
    assert.deepEqual(this.router.transitions[0].options.queryParams, {
      words: '',
      lemmas: '',
      tags: '',
      restrict: '',
      all: false,
      sort: false,
      page: 1,
      size: 25,
    });
  });

  test('runQuery does nothing when no terms are selected', async function (assert) {
    const controller = this.controller;
    controller.result = { hits: { total: { value: 1 }, hits: [] } };

    await controller.runQuery();

    assert.strictEqual(controller.result, null, 'a stale result is dropped');
    assert.strictEqual(controller.searchError, null, 'and no error is shown');
  });

  test('runQuery surfaces a failing search service', async function (assert) {
    const controller = this.controller;
    controller.words = 'god';
    this.owner.register(
      'service:localsearch',
      class extends Service {
        executeQuery() {
          return Promise.reject(new Error('boom'));
        }
      },
    );

    await controller.runQuery();

    assert.strictEqual(controller.searchError, 'Search service unavailable: boom');
  });
});
