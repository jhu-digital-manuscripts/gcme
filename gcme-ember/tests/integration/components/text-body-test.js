import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, triggerEvent, focus } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';
import { setupCorpus, LINES, GROUP_TITLES } from '../../helpers/corpus-fixture';
import afterRender from 'gcme-ember/utils/after-render';
import { buildTextBlocks } from 'gcme-ember/utils/text/sections';

/** Records the transitions the component asks for. */
class StubRouter extends Service {
  transitions = [];

  transitionTo(route, options) {
    this.transitions.push({ route, options });
  }
}

/**
 * Build the text of a group from the fixture corpus.
 *
 * @param {string} groupId
 * @returns {Object}
 */
function textFor(groupId) {
  const indices = [];
  LINES.forEach((line, index) => {
    if (line.group.includes(groupId)) {
      indices.push(index);
    }
  });
  return buildTextBlocks({ lines: LINES, indices, groupId, titles: GROUP_TITLES });
}

module('Integration | Component | text-body', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:router', StubRouter);
    setupCorpus(this.owner);
    this.text = textFor('GP');
    this.groupId = 'GP';
  });

  test('it renders the lines of the text with their numbers', async function (assert) {
    await render(
      hbs`<TextBody @text={{this.text}} @groupId={{this.groupId}} />`,
    );

    assert.dom('.gcme-text-title').hasText('General Prologoue');
    assert.dom('.gcme-text-line').exists({ count: 7 });

    const numbers = [...this.element.querySelectorAll('.gcme-text-number')].map(
      (element) => element.textContent.trim(),
    );
    assert.deepEqual(numbers, ['1', '', '', '', '5', '', '10']);

    assert
      .dom('.gcme-text-line[data-raw="5"]')
      .hasText('5 God, that he may', 'the line is rendered as plain text');
  });

  test('it renders a heading for each text of an intermediate group', async function (assert) {
    this.text = textFor('CT');
    this.groupId = 'CT';

    await render(
      hbs`<TextBody @text={{this.text}} @groupId={{this.groupId}} />`,
    );

    const headings = [...this.element.querySelectorAll('.gcme-text-heading')].map(
      (element) => element.textContent.trim(),
    );
    assert.deepEqual(headings, [
      'Canterbury Tales - Fragment I',
      'General Prologoue',
      "Knight's Tale",
    ]);
    assert.dom('.gcme-text-line').exists({ count: 10 });
  });

  test('words become buttons when the pointer reaches a line', async function (assert) {
    await render(
      hbs`<TextBody @text={{this.text}} @groupId={{this.groupId}} />`,
    );

    assert.dom('.gcme-word').doesNotExist('no words are wrapped up front');

    await triggerEvent('.gcme-text-line[data-raw="5"]', 'mouseover');

    assert.dom('.gcme-text-line[data-raw="5"] .gcme-word').exists({ count: 4 });
    assert.dom('.gcme-text-line[data-raw="1"] .gcme-word').doesNotExist();
    assert
      .dom('.gcme-text-line[data-raw="5"]')
      .hasText('5 God, that he may', 'the words still read as one line');
  });

  test('words become buttons when keyboard focus reaches a line', async function (assert) {
    await render(
      hbs`<TextBody @text={{this.text}} @groupId={{this.groupId}} />`,
    );

    await focus('.gcme-text-line[data-raw="10"]');

    assert.dom('.gcme-text-line[data-raw="10"] .gcme-word').exists({ count: 4 });
  });

  test('clicking a word opens a popup with its definition and counts', async function (assert) {
    await render(
      hbs`<TextBody @text={{this.text}} @groupId={{this.groupId}} />`,
    );

    await triggerEvent('.gcme-text-line[data-raw="5"]', 'mouseover');
    await click('.gcme-text-line[data-raw="5"] .gcme-word');

    assert.dom('.gcme-word-popup').exists();
    await afterRender();
    assert.dom('.gcme-word-popup').isFocused('focus moves into the popup');
    assert.dom('.gcme-word-popup-word').hasText('God,');
    assert.dom('.gcme-word-popup').includesText('god@n1');
    assert.dom('.gcme-word-popup').includesText('God, the deity');
    assert
      .dom('.gcme-word-popup-stats')
      .includesText('2', 'lines of this text containing the word');
    assert
      .dom('.gcme-word-popup-stats')
      .includesText('3', 'lines of the corpus containing the word');
  });

  test('the popup reports an untagged word', async function (assert) {
    this.text = textFor('KnT');
    this.groupId = 'KnT';

    await render(
      hbs`<TextBody @text={{this.text}} @groupId={{this.groupId}} />`,
    );

    await triggerEvent('.gcme-text-line[data-raw="Rub"]', 'mouseover');
    await click('.gcme-text-line[data-raw="Rub"] .gcme-word');

    assert.dom('.gcme-word-popup').includesText('not tagged in the concordance');
  });

  test('Escape closes the popup', async function (assert) {
    await render(
      hbs`<TextBody @text={{this.text}} @groupId={{this.groupId}} />`,
    );

    await triggerEvent('.gcme-text-line[data-raw="5"]', 'mouseover');
    await click('.gcme-text-line[data-raw="5"] .gcme-word');
    assert.dom('.gcme-word-popup').exists();

    await triggerEvent('.gcme-word-popup', 'keydown', { key: 'Escape' });

    assert.dom('.gcme-word-popup').doesNotExist();
  });

  test('the close button closes the popup', async function (assert) {
    await render(
      hbs`<TextBody @text={{this.text}} @groupId={{this.groupId}} />`,
    );

    await triggerEvent('.gcme-text-line[data-raw="5"]', 'mouseover');
    await click('.gcme-text-line[data-raw="5"] .gcme-word');
    await click('.gcme-word-popup .btn-close');

    assert.dom('.gcme-word-popup').doesNotExist();
  });

  test('the popup searches for the word', async function (assert) {
    await render(
      hbs`<TextBody @text={{this.text}} @groupId={{this.groupId}} />`,
    );

    await triggerEvent('.gcme-text-line[data-raw="5"]', 'mouseover');
    await click('.gcme-text-line[data-raw="5"] .gcme-word');
    await click('.gcme-word-popup .btn-primary');

    const router = this.owner.lookup('service:router');
    assert.strictEqual(router.transitions.length, 1);
    assert.strictEqual(router.transitions[0].route, 'search');
    assert.deepEqual(router.transitions[0].options.queryParams, {
      words: 'god',
      lemmas: '',
      tags: '',
      restrict: '',
      all: false,
      sort: false,
      page: 1,
    });
    assert.dom('.gcme-word-popup').doesNotExist('the popup closes');
  });

  test('clicking outside the popup closes it', async function (assert) {
    await render(
      hbs`<TextBody @text={{this.text}} @groupId={{this.groupId}} />`,
    );

    await triggerEvent('.gcme-text-line[data-raw="5"]', 'mouseover');
    await click('.gcme-text-line[data-raw="5"] .gcme-word');
    await click('.gcme-text-title');

    assert.dom('.gcme-word-popup').doesNotExist();
  });
});
