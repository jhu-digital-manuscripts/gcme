import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { GROUP_TITLES } from '../../helpers/corpus-fixture';

module('Integration | Component | result-location-cell', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders nothing but the separator without a record', async function (assert) {
    await render(hbs`<ResultLocationCell />`);

    assert.dom().hasText('-');
  });

  test('it names the author and the most specific text', async function (assert) {
    this.record = {
      _source: {
        id: '01-1-ch',
        raw_number: '252a',
        group: ['Ch', 'CT', 'Frag1', 'GP'],
      },
    };
    this.column = { groupTitleMap: GROUP_TITLES };

    await render(
      hbs`<ResultLocationCell @record={{this.record}} @column={{this.column}} />`,
    );

    assert.dom().includesText('Geoffrey Chaucer');
    assert.dom('a').hasText('General Prologoue');
  });

  test('the text links into the reading view at that line', async function (assert) {
    this.record = {
      _source: {
        id: '01-2-ch',
        raw_number: '252a',
        group: ['Ch', 'CT', 'Frag1', 'KnT'],
      },
    };
    this.column = { groupTitleMap: GROUP_TITLES };

    await render(
      hbs`<ResultLocationCell @record={{this.record}} @column={{this.column}} />`,
    );

    const href = this.element.querySelector('a').getAttribute('href');
    assert.ok(href.includes('/text'), `${href} points at the text route`);
    assert.ok(href.includes('group=KnT'), `${href} selects the text`);
    assert.ok(href.includes('line=252a'), `${href} names the line`);
  });

  test('a two-level group path still links to its text', async function (assert) {
    this.record = {
      _source: { id: '01-gow', raw_number: '1', group: ['Gow', 'Peace'] },
    };
    this.column = { groupTitleMap: { Gow: 'John Gower', Peace: 'In Praise of Peace' } };

    await render(
      hbs`<ResultLocationCell @record={{this.record}} @column={{this.column}} />`,
    );

    assert.dom().includesText('John Gower');
    assert.dom('a').hasText('In Praise of Peace');
    assert.ok(
      this.element.querySelector('a').getAttribute('href').includes('group=Peace'),
    );
  });
});
