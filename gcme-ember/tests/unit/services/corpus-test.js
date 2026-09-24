import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { setupCorpus } from '../../helpers/corpus-fixture';

module('Unit | Service | corpus', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.corpus = setupCorpus(this.owner);
  });

  test('it exposes the loaded data and its indexes', function (assert) {
    assert.true(this.corpus.isReady);
    assert.strictEqual(this.corpus.lines.length, 10);
    assert.ok(this.corpus.lineIndexes.textIndex.has('god'));
    assert.ok(this.corpus.completionIndexes.wordSuggest.length > 0);
    assert.strictEqual(this.corpus.dicts.wordDict.length, 3);
  });

  test('lineIndicesForGroup returns the lines of a leaf group in corpus order', function (assert) {
    assert.deepEqual(this.corpus.lineIndicesForGroup('GP'), [0, 1, 2, 3, 4, 5, 6]);
    assert.deepEqual(this.corpus.lineIndicesForGroup('KnT'), [7, 8, 9]);
  });

  test('lineIndicesForGroup matches any level of the group path', function (assert) {
    assert.deepEqual(
      this.corpus.lineIndicesForGroup('CT'),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      'an intermediate group collects every text below it',
    );
    assert.deepEqual(this.corpus.lineIndicesForGroup('Nope'), []);
  });

  test('wordLineCounts counts lines, not occurrences', function (assert) {
    // `god` is in three lines: `God, that he may`, `A god may slepe`, and
    // `Ther was a god`.
    assert.deepEqual(this.corpus.wordLineCounts('god', 'GP'), { text: 2, corpus: 3 });
    assert.deepEqual(this.corpus.wordLineCounts('god', 'KnT'), { text: 1, corpus: 3 });
    assert.deepEqual(this.corpus.wordLineCounts('god', 'CT'), { text: 3, corpus: 3 });
  });

  test('wordLineCounts ignores punctuation and case, as the search does', function (assert) {
    assert.deepEqual(this.corpus.wordLineCounts('God,', 'GP'), { text: 2, corpus: 3 });
  });

  test('wordLineCounts reports no text count without a group', function (assert) {
    assert.deepEqual(this.corpus.wordLineCounts('god'), { text: null, corpus: 3 });
  });

  test('wordLineCounts is zero for an unknown word', function (assert) {
    assert.deepEqual(this.corpus.wordLineCounts('nonesuch', 'GP'), { text: 0, corpus: 0 });
    assert.deepEqual(this.corpus.wordLineCounts('', 'GP'), { text: 0, corpus: 0 });
  });

  test('wordInfo describes a word of a line with its counts', function (assert) {
    const info = this.corpus.wordInfo({ lineIndex: 4, tokenIndex: 0, groupId: 'GP' });

    assert.strictEqual(info.display, 'God,');
    assert.strictEqual(info.word, 'god');
    assert.strictEqual(info.lemmaTag, 'god@n1');
    assert.strictEqual(info.definition.head, 'God, god n.(1)');
    assert.deepEqual(info.counts, { text: 2, corpus: 3 });
    assert.strictEqual(info.lineIndex, 4);
    assert.strictEqual(info.tokenIndex, 0);
    assert.strictEqual(info.line.raw_number, '5');
  });

  test('wordInfo returns null for a position that is not a word', function (assert) {
    assert.strictEqual(
      this.corpus.wordInfo({ lineIndex: 4, tokenIndex: 12, groupId: 'GP' }),
      null,
    );
    assert.strictEqual(
      this.corpus.wordInfo({ lineIndex: 999, tokenIndex: 0, groupId: 'GP' }),
      null,
    );
  });
});
