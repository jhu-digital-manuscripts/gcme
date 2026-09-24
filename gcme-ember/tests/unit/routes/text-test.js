import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';
import {
  setupCorpus,
  TEXT_POWERSEL,
  GROUP_TITLES,
} from '../../helpers/corpus-fixture';

module('Unit | Route | text', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.route = this.owner.lookup('route:text');
    // Pretend the static files have been fetched already.
    this.route._staticData = {
      restrictData: TEXT_POWERSEL,
      groupTitleMap: GROUP_TITLES,
    };
  });

  test('it exists', function (assert) {
    assert.ok(this.route);
  });

  test('no selected text loads nothing', async function (assert) {
    const model = await this.route.model({ group: '' });

    assert.strictEqual(model.text, null);
    assert.strictEqual(model.group, '');
    assert.strictEqual(model.loadError, null);
    assert.strictEqual(model.restrictData, TEXT_POWERSEL);
  });

  test('it builds the selected text from the corpus', async function (assert) {
    setupCorpus(this.owner);

    const model = await this.route.model({ group: 'GP' });

    assert.strictEqual(model.group, 'GP');
    assert.strictEqual(model.text.title, 'General Prologoue');
    assert.strictEqual(model.text.lineCount, 7);
    assert.strictEqual(model.loadError, null);
  });

  test('it reuses the built text when only the line changes', async function (assert) {
    setupCorpus(this.owner);

    const first = await this.route.model({ group: 'GP' });
    const second = await this.route.model({ group: 'GP', line: '5' });
    const other = await this.route.model({ group: 'KnT' });

    assert.strictEqual(second.text, first.text, 'the same text is not rebuilt');
    assert.notStrictEqual(other.text, first.text, 'another text is built');
  });

  test('it reports a corpus that will not load', async function (assert) {
    this.owner.register(
      'service:corpus',
      class extends Service {
        ensureReady() {
          return Promise.reject(new Error('offline'));
        }
      },
    );

    const model = await this.route.model({ group: 'GP' });

    assert.strictEqual(model.text, null);
    assert.strictEqual(model.loadError, 'The texts could not be loaded: offline');
  });
});
