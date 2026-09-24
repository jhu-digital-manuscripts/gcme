import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { visit, currentURL, click } from '@ember/test-helpers';
import { setupCorpus } from '../helpers/corpus-fixture';
import { setupStaticFiles } from '../helpers/stub-static-files';
import afterRender from 'gcme-ember/utils/after-render';

module('Acceptance | search in the URL', function (hooks) {
  setupApplicationTest(hooks);
  setupStaticFiles(hooks);

  hooks.beforeEach(function () {
    // The localsearch backend answers from the corpus service, so the fixture
    // is the whole corpus for these tests.
    setupCorpus(this.owner);
  });

  test('the root redirects to the search page', async function (assert) {
    await visit('/');

    assert.strictEqual(currentURL(), '/search');
  });

  test('a bookmarked search runs on load and fills the form', async function (assert) {
    await visit('/search?words=god');

    assert.dom('.models-table-wrapper').exists('results are shown');
    assert.dom('h3').includesText('total 3', 'god appears in three lines');
    assert
      .dom('.ember-power-select-multiple-option')
      .includesText('god', 'the searched word is shown in the form');
  });

  test('a bookmarked search restores every parameter', async function (assert) {
    await visit('/search?words=god,may&all=true&restrict=GP&sort=true&size=1&page=2');

    const controller = this.owner.lookup('controller:search');

    assert.deepEqual(controller.wordList, ['god', 'may']);
    assert.true(controller.all);
    assert.true(controller.sort);
    assert.deepEqual(controller.restrictList, ['GP']);
    assert.strictEqual(controller.pageSize, 1);
    assert.strictEqual(controller.pageNumber, 2);
    // `god` and `may` are together only in `God, that he may` and
    // `A god may slepe`, both in the General Prologue.
    assert.dom('h3').includesText('Matches 2-2 of total 2');
  });

  test('an empty search page shows no results and no error', async function (assert) {
    await visit('/search');

    assert.dom('.models-table-wrapper').doesNotExist();
    assert.dom('.alert').doesNotExist();
  });

  test('pressing Search records the search in the URL', async function (assert) {
    await visit('/search');

    const controller = this.owner.lookup('controller:search');
    controller.draftWords = [{ word: 'god', _match: 'god' }];
    controller.draftRestrict = [{ id: 'KnT', label: "Knight's Tale" }];

    await click('#gcme-search-buttons .btn-primary');

    assert.strictEqual(currentURL(), '/search?restrict=KnT&words=god');
    assert.dom('h3').includesText('total 1', 'restricted to the Knight’s Tale');
  });

  test('paging is recorded in the URL and fetches that page', async function (assert) {
    await visit('/search?words=god&size=1&sort=true');

    assert.dom('tbody').includesText('God, that he may', 'the first match');

    await click('#gcme-search-pages .page-item:last-child button');

    assert.strictEqual(currentURL(), '/search?page=2&size=1&sort=true&words=god');
    assert.dom('h3').includesText('Matches 2-2 of total 3');
    assert.dom('tbody').includesText('A god may slepe', 'the second match');
    assert.dom('tbody').doesNotIncludeText('God, that he may');
  });

  test('a bookmarked page shows that page of matches', async function (assert) {
    await visit('/search?words=god&size=1&sort=true&page=3');

    assert.dom('h3').includesText('Matches 3-3 of total 3');
    assert.dom('tbody').includesText('Ther was a god', 'the third match');
  });

  test('Clear empties the search and the URL', async function (assert) {
    await visit('/search?words=god');

    await click('#gcme-search-buttons .btn-secondary');

    assert.strictEqual(currentURL(), '/search');
    assert.dom('.models-table-wrapper').doesNotExist();
  });

  test('a search result links into the reading view at that line', async function (assert) {
    await visit('/search?words=god&sort=true');

    const link = this.element.querySelector('.models-table-wrapper tbody a');
    assert.dom(link).hasText('General Prologoue');

    await click(link);
    await afterRender();

    assert.strictEqual(currentURL(), '/text?group=GP&line=5');
    assert.dom('.gcme-text-line-target').includesText('God, that he may');
  });
});
