import { module, test } from 'qunit';
import {
  buildLineIndexes,
  buildCompletionIndexes,
} from 'gcme-ember/utils/localsearch/index-assembler';

module('Unit | Utils | localsearch/index-assembler', function () {
  module('buildLineIndexes', function () {
    test('indexes text field with simpleAnalyzer', function (assert) {
      const lines = [
        { text: 'Hello World', lemma_text: '', lemma_tag_text: '' },
        { text: 'World Peace', lemma_text: '', lemma_tag_text: '' },
      ];

      const { textIndex } = buildLineIndexes(lines);

      assert.deepEqual(textIndex.get('hello'), [0], 'hello maps to line 0');
      assert.deepEqual(textIndex.get('world'), [0, 1], 'world maps to lines 0 and 1');
      assert.deepEqual(textIndex.get('peace'), [1], 'peace maps to line 1');
    });

    test('indexes lemma_text field with whitespaceIgnoreCaseAnalyzer', function (assert) {
      const lines = [
        { text: '', lemma_text: 'love@n hate@v', lemma_tag_text: '' },
        { text: '', lemma_text: 'love@n joy@n', lemma_tag_text: '' },
      ];

      const { lemmaTextIndex } = buildLineIndexes(lines);

      assert.deepEqual(lemmaTextIndex.get('love@n'), [0, 1], 'love@n maps to both lines');
      assert.deepEqual(lemmaTextIndex.get('hate@v'), [0], 'hate@v maps to line 0');
      assert.deepEqual(lemmaTextIndex.get('joy@n'), [1], 'joy@n maps to line 1');
    });

    test('indexes lemma_tag_text field with whitespaceIgnoreCaseAnalyzer', function (assert) {
      const lines = [
        { text: '', lemma_text: '', lemma_tag_text: 'Run@v Walk@v' },
      ];

      const { lemmaTagTextIndex } = buildLineIndexes(lines);

      assert.deepEqual(lemmaTagTextIndex.get('run@v'), [0], 'lowercased run@v maps to line 0');
      assert.deepEqual(lemmaTagTextIndex.get('walk@v'), [0], 'lowercased walk@v maps to line 0');
    });

    test('stores integer indices, not object copies', function (assert) {
      const lines = [
        { text: 'test word', lemma_text: '', lemma_tag_text: '' },
      ];

      const { textIndex } = buildLineIndexes(lines);
      const indices = textIndex.get('test');

      assert.strictEqual(typeof indices[0], 'number', 'index is a number');
      assert.strictEqual(indices[0], 0, 'index is 0 for the first line');
    });

    test('handles empty lines array', function (assert) {
      const { textIndex, lemmaTextIndex, lemmaTagTextIndex } = buildLineIndexes([]);

      assert.strictEqual(textIndex.size, 0);
      assert.strictEqual(lemmaTextIndex.size, 0);
      assert.strictEqual(lemmaTagTextIndex.size, 0);
    });

    test('handles lines with empty or missing text fields', function (assert) {
      const lines = [
        { text: '', lemma_text: null, lemma_tag_text: undefined },
        { text: 'word', lemma_text: '', lemma_tag_text: '' },
      ];

      const { textIndex, lemmaTextIndex, lemmaTagTextIndex } = buildLineIndexes(lines);

      assert.deepEqual(textIndex.get('word'), [1]);
      assert.strictEqual(lemmaTextIndex.size, 0);
      assert.strictEqual(lemmaTagTextIndex.size, 0);
    });

    test('does not duplicate index when same token appears multiple times in one line', function (assert) {
      const lines = [
        { text: 'the cat and the dog', lemma_text: '', lemma_tag_text: '' },
      ];

      const { textIndex } = buildLineIndexes(lines);

      assert.deepEqual(textIndex.get('the'), [0], 'the appears once for line 0 even though it occurs twice');
    });
  });

  module('buildCompletionIndexes', function () {
    test('builds wordSuggest from word field', function (assert) {
      const wordDict = [
        { word: 'Banana', lemma_tag: [], definition: [] },
        { word: 'Apple', lemma_tag: [], definition: [] },
      ];

      const { wordSuggest } = buildCompletionIndexes(wordDict, [], []);

      assert.strictEqual(wordSuggest.length, 2);
      // Sorted lexicographically by token
      assert.strictEqual(wordSuggest[0].token, 'apple');
      assert.strictEqual(wordSuggest[0].docIndex, 1);
      assert.strictEqual(wordSuggest[1].token, 'banana');
      assert.strictEqual(wordSuggest[1].docIndex, 0);
    });

    test('builds lemmaSuggest from lemma field', function (assert) {
      const lemmaDict = [
        { lemma: 'run', word: [], lemma_tag: [], definition: [] },
        { lemma: 'jump', word: [], lemma_tag: [], definition: [] },
      ];

      const { lemmaSuggest } = buildCompletionIndexes([], lemmaDict, []);

      assert.strictEqual(lemmaSuggest.length, 2);
      assert.strictEqual(lemmaSuggest[0].token, 'jump');
      assert.strictEqual(lemmaSuggest[0].docIndex, 1);
      assert.strictEqual(lemmaSuggest[1].token, 'run');
      assert.strictEqual(lemmaSuggest[1].docIndex, 0);
    });

    test('builds lemmaTagSuggest from lemma_tag field', function (assert) {
      const lemmaTagDict = [
        { lemma_tag: 'love@n', definition: '', word: [] },
        { lemma_tag: 'hate@v', definition: '', word: [] },
      ];

      const { lemmaTagSuggest } = buildCompletionIndexes([], [], lemmaTagDict);

      assert.strictEqual(lemmaTagSuggest.length, 2);
      assert.strictEqual(lemmaTagSuggest[0].token, 'hate@v');
      assert.strictEqual(lemmaTagSuggest[0].docIndex, 1);
      assert.strictEqual(lemmaTagSuggest[1].token, 'love@n');
      assert.strictEqual(lemmaTagSuggest[1].docIndex, 0);
    });

    test('tokens are lowercased', function (assert) {
      const wordDict = [
        { word: 'UPPER', lemma_tag: [], definition: [] },
        { word: 'Mixed', lemma_tag: [], definition: [] },
      ];

      const { wordSuggest } = buildCompletionIndexes(wordDict, [], []);

      assert.strictEqual(wordSuggest[0].token, 'mixed');
      assert.strictEqual(wordSuggest[1].token, 'upper');
    });

    test('sorts lexicographically by token', function (assert) {
      const wordDict = [
        { word: 'zebra', lemma_tag: [], definition: [] },
        { word: 'apple', lemma_tag: [], definition: [] },
        { word: 'mango', lemma_tag: [], definition: [] },
      ];

      const { wordSuggest } = buildCompletionIndexes(wordDict, [], []);

      assert.strictEqual(wordSuggest[0].token, 'apple');
      assert.strictEqual(wordSuggest[1].token, 'mango');
      assert.strictEqual(wordSuggest[2].token, 'zebra');
    });

    test('skips entries with null or empty field values', function (assert) {
      const wordDict = [
        { word: 'valid', lemma_tag: [], definition: [] },
        { word: '', lemma_tag: [], definition: [] },
        { word: null, lemma_tag: [], definition: [] },
      ];

      const { wordSuggest } = buildCompletionIndexes(wordDict, [], []);

      assert.strictEqual(wordSuggest.length, 1);
      assert.strictEqual(wordSuggest[0].token, 'valid');
    });

    test('handles empty dictionaries', function (assert) {
      const { wordSuggest, lemmaSuggest, lemmaTagSuggest } = buildCompletionIndexes([], [], []);

      assert.strictEqual(wordSuggest.length, 0);
      assert.strictEqual(lemmaSuggest.length, 0);
      assert.strictEqual(lemmaTagSuggest.length, 0);
    });
  });
});
