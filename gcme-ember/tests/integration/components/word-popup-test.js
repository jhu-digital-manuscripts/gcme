import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const TAGGED_WORD = {
  display: 'God,',
  word: 'god',
  lemma: 'god',
  lemmaTag: 'god@n1',
  tag: 'n1',
  concorded: true,
  definition: { head: 'God, god n.(1)', gloss: '"God, the deity," s.v. God OED.' },
  otherSenses: [
    { lemmaTag: 'god@adj', definition: { head: 'god adj.', gloss: '"good," s.v. good a. OED.' } },
  ],
  counts: { text: 2, corpus: 3 },
};

const UNTAGGED_WORD = {
  display: 'Incipit',
  word: 'incipit',
  lemma: '',
  lemmaTag: '',
  tag: '',
  concorded: false,
  definition: null,
  otherSenses: [],
  counts: { text: 1, corpus: 1 },
};

module('Integration | Component | word-popup', function (hooks) {
  setupRenderingTest(hooks);

  test('it shows the headword, the tag, the definition, and the counts', async function (assert) {
    this.info = TAGGED_WORD;

    await render(hbs`
      <WordPopup
        @info={{this.info}}
        @top={{40}}
        @left={{10}}
        @textTitle="General Prologoue"
        @onClose={{this.noop}}
        @onSearch={{this.noop}}
      />
    `);

    assert.dom('.gcme-word-popup-word').hasText('God,');
    assert.dom('.gcme-word-popup-terms').includesText('god@n1');
    assert.dom('.gcme-word-popup-definition').includesText('God, the deity');
    assert.dom('.gcme-word-popup-senses').includesText('god@adj');
    assert.dom('.gcme-word-popup-stats').includesText('General Prologoue');
    assert.dom('.gcme-word-popup-stats').includesText('2');
    assert.dom('.gcme-word-popup-stats').includesText('3');
    assert.dom('.gcme-word-popup').hasAttribute('style', /top: 40px/);
    assert.dom('.gcme-word-popup').hasAttribute('style', /left: 10px/);
    assert.dom('.gcme-word-popup').hasAttribute('role', 'dialog');
  });

  test('it explains an untagged word', async function (assert) {
    this.info = UNTAGGED_WORD;

    await render(hbs`
      <WordPopup @info={{this.info}} @top={{0}} @left={{0}} @textTitle="Knight's Tale" />
    `);

    assert.dom('.gcme-word-popup').includesText('not tagged in the concordance');
    assert.dom('.gcme-word-popup-terms').doesNotExist();
    assert.dom('.gcme-word-popup-senses').doesNotExist();
    assert.dom('.gcme-word-popup-stats').includesText('1');
  });

  test('the search button reports the dictionary spelling', async function (assert) {
    this.info = TAGGED_WORD;
    this.searched = [];
    this.onSearch = (word) => this.searched.push(word);

    await render(hbs`
      <WordPopup @info={{this.info}} @top={{0}} @left={{0}} @onSearch={{this.onSearch}} />
    `);

    assert.dom('.gcme-word-popup .btn-primary').hasText('Search for god');

    await click('.gcme-word-popup .btn-primary');

    assert.deepEqual(this.searched, ['god']);
  });

  test('the close button calls onClose', async function (assert) {
    this.info = TAGGED_WORD;
    this.closed = 0;
    this.onClose = () => this.closed++;

    await render(hbs`
      <WordPopup @info={{this.info}} @top={{0}} @left={{0}} @onClose={{this.onClose}} />
    `);

    await click('.gcme-word-popup .btn-close');

    assert.strictEqual(this.closed, 1);
  });
});
