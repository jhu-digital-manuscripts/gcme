import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setupCorpus, GROUP_TITLES, TEXT_POWERSEL } from '../../helpers/corpus-fixture';
import { buildTextBlocks } from 'gcme-ember/utils/text/sections';

module('Unit | Controller | text', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.controller = this.owner.lookup('controller:text');
    this.controller.model = {
      restrictData: TEXT_POWERSEL,
      groupTitleMap: GROUP_TITLES,
    };
  });

  test('it exists', function (assert) {
    assert.ok(this.controller);
  });

  test('selectedOption is the dropdown option for the group in the URL', function (assert) {
    assert.strictEqual(this.controller.selectedOption, null, 'nothing is selected');

    this.controller.group = 'KnT';

    assert.strictEqual(this.controller.selectedOption.label, "Knight's Tale");
  });

  test('selectedOption is null for a group the dropdown does not offer', function (assert) {
    this.controller.group = 'Nope';

    assert.strictEqual(this.controller.selectedOption, null);
  });

  test('scrollToLine does nothing without a line', function (assert) {
    // A missing or unknown line must not throw; the text is simply shown from
    // its beginning.
    this.controller.scrollToLine('');
    this.controller.scrollToLine('9999');

    assert.ok(true);
  });

  test('the corpus builds the same rows the reading view renders', function (assert) {
    const corpus = setupCorpus(this.owner);
    const text = buildTextBlocks({
      lines: corpus.lines,
      indices: corpus.lineIndicesForGroup('KnT'),
      groupId: 'KnT',
      titles: GROUP_TITLES,
    });

    assert.deepEqual(
      [...text.rowsByIndex.keys()],
      [7, 8, 9],
      'the rows are the lines of the group',
    );
  });
});
