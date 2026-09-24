import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { visit, currentURL, click, triggerEvent } from '@ember/test-helpers';
import { setupCorpus } from '../helpers/corpus-fixture';
import { setupStaticFiles } from '../helpers/stub-static-files';

module('Acceptance | reading a text', function (hooks) {
  setupApplicationTest(hooks);
  setupStaticFiles(hooks);

  hooks.beforeEach(function () {
    setupCorpus(this.owner);
  });

  test('the navigation bar offers the text view after the search', async function (assert) {
    await visit('/search');

    const tabs = [...this.element.querySelectorAll('.navbar-nav .nav-link')].map(
      (link) => link.textContent.trim(),
    );
    assert.deepEqual(tabs, ['About', 'Search', 'Text', 'Tags', 'How To Guide', 'Contact']);
  });

  test('with no text chosen it invites the reader to choose one', async function (assert) {
    await visit('/text');

    assert.dom('.ember-power-select-trigger').exists('the text dropdown is shown');
    assert.dom('.gcme-text').doesNotExist();
    assert.dom('.gcme-text-page').includesText('Choose a text above to start reading');
  });

  test('a bookmarked text is rendered with its line numbers', async function (assert) {
    await visit('/text?group=GP');

    assert.dom('.gcme-text-title').hasText('General Prologoue');
    assert.dom('.gcme-text-line').exists({ count: 7 });
    assert.dom('.gcme-text-line[data-raw="5"]').includesText('God, that he may');

    const numbers = [...this.element.querySelectorAll('.gcme-text-number')].map(
      (element) => element.textContent.trim(),
    );
    assert.deepEqual(numbers, ['1', '', '', '', '5', '', '10'], 'every fifth line');
  });

  test('an intermediate group reads as a sequence of titled texts', async function (assert) {
    await visit('/text?group=CT');

    assert.dom('.gcme-text-title').hasText('The Canterbury Tales');
    assert.dom('.gcme-text-line').exists({ count: 10 });

    const headings = [...this.element.querySelectorAll('.gcme-text-heading')].map(
      (element) => element.textContent.trim(),
    );
    assert.deepEqual(headings, [
      'Canterbury Tales - Fragment I',
      'General Prologoue',
      "Knight's Tale",
    ]);
  });

  test('choosing a text records it in the URL', async function (assert) {
    await visit('/text');

    this.owner.lookup('controller:text').selectText({ id: 'KnT', label: "Knight's Tale" });
    await visit('/text?group=KnT');

    assert.strictEqual(currentURL(), '/text?group=KnT');
    assert.dom('.gcme-text-title').hasText("Knight's Tale");
    assert.dom('.gcme-text-line').exists({ count: 3 });
  });

  test('a linked line is marked and the rest of the text is still there', async function (assert) {
    await visit('/text?group=GP&line=10');

    assert.dom('.gcme-text-line-target').exists({ count: 1 });
    assert.dom('.gcme-text-line-target').includesText('A god may slepe');
    assert.dom('.gcme-text-line').exists({ count: 7 });
  });

  test('clicking a word describes it and can search for it', async function (assert) {
    await visit('/text?group=GP');

    await triggerEvent('.gcme-text-line[data-raw="5"]', 'mouseover');
    await click('.gcme-text-line[data-raw="5"] .gcme-word');

    assert.dom('.gcme-word-popup').includesText('God, the deity');
    assert
      .dom('.gcme-word-popup-stats')
      .includesText('General Prologoue', 'counts name the text being read');

    await click('.gcme-word-popup .btn-primary');

    assert.strictEqual(currentURL(), '/search?words=god');
    assert.dom('h3').includesText('total 3', 'the search ran for the word');
  });

  test('counts follow the selected text', async function (assert) {
    await visit('/text?group=CT');

    await triggerEvent('.gcme-text-line[data-raw="5"]', 'mouseover');
    await click('.gcme-text-line[data-raw="5"] .gcme-word');

    // `god` is in three lines of the Canterbury Tales as a whole.
    assert.dom('.gcme-word-popup-stats').includesText('The Canterbury Tales');
    const counts = [
      ...this.element.querySelectorAll('.gcme-word-popup-stats td'),
    ].map((cell) => cell.textContent.trim());
    assert.deepEqual(counts, ['3', '3']);
  });
});
