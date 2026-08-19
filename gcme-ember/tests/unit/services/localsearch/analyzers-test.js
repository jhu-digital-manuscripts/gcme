import { module, test } from 'qunit';
import {
  simpleAnalyzer,
  whitespaceIgnoreCaseAnalyzer,
  keywordAnalyzer,
} from 'gcme-ember/utils/localsearch/analyzers';

module('Unit | Utils | localsearch/analyzers', function () {
  module('simpleAnalyzer', function () {
    test('splits on non-letter characters and lowercases tokens', function (assert) {
      assert.deepEqual(
        simpleAnalyzer('Hello World'),
        ['hello', 'world'],
      );
    });

    test('discards digits and punctuation between words', function (assert) {
      assert.deepEqual(
        simpleAnalyzer('one2three!four'),
        ['one', 'three', 'four'],
      );
    });

    test('returns empty array for empty string', function (assert) {
      assert.deepEqual(simpleAnalyzer(''), []);
    });

    test('returns empty array for whitespace-only input', function (assert) {
      assert.deepEqual(simpleAnalyzer('   \t\n  '), []);
    });

    test('returns empty array for digits-only input', function (assert) {
      assert.deepEqual(simpleAnalyzer('12345'), []);
    });

    test('returns empty array for punctuation-only input', function (assert) {
      assert.deepEqual(simpleAnalyzer('!@#$%'), []);
    });

    test('handles mixed case', function (assert) {
      assert.deepEqual(
        simpleAnalyzer('CaMeL'),
        ['camel'],
      );
    });

    test('handles leading/trailing non-letter characters', function (assert) {
      assert.deepEqual(
        simpleAnalyzer('---hello---'),
        ['hello'],
      );
    });
  });

  module('whitespaceIgnoreCaseAnalyzer', function () {
    test('splits on whitespace and lowercases tokens', function (assert) {
      assert.deepEqual(
        whitespaceIgnoreCaseAnalyzer('Hello World'),
        ['hello', 'world'],
      );
    });

    test('preserves non-letter characters within tokens', function (assert) {
      assert.deepEqual(
        whitespaceIgnoreCaseAnalyzer('love@n test%2'),
        ['love@n', 'test%2'],
      );
    });

    test('folds Unicode diacritics to ASCII', function (assert) {
      assert.deepEqual(
        whitespaceIgnoreCaseAnalyzer('café résumé'),
        ['cafe', 'resume'],
      );
    });

    test('handles accented uppercase characters', function (assert) {
      assert.deepEqual(
        whitespaceIgnoreCaseAnalyzer('ÜBER Straße'),
        ['uber', 'strasse'],
      );
    });

    test('returns empty array for empty string', function (assert) {
      assert.deepEqual(whitespaceIgnoreCaseAnalyzer(''), []);
    });

    test('returns empty array for whitespace-only input', function (assert) {
      assert.deepEqual(whitespaceIgnoreCaseAnalyzer('   \t\n  '), []);
    });

    test('handles multiple whitespace types', function (assert) {
      assert.deepEqual(
        whitespaceIgnoreCaseAnalyzer('a\tb\nc'),
        ['a', 'b', 'c'],
      );
    });

    test('preserves underscores within tokens', function (assert) {
      assert.deepEqual(
        whitespaceIgnoreCaseAnalyzer('lemma_tag'),
        ['lemma_tag'],
      );
    });
  });

  module('keywordAnalyzer', function () {
    test('returns single-element array with lowercased input', function (assert) {
      assert.deepEqual(
        keywordAnalyzer('Hello World'),
        ['hello world'],
      );
    });

    test('does not split on any characters', function (assert) {
      assert.deepEqual(
        keywordAnalyzer('one two three'),
        ['one two three'],
      );
    });

    test('preserves punctuation and special characters', function (assert) {
      assert.deepEqual(
        keywordAnalyzer('love@n1'),
        ['love@n1'],
      );
    });

    test('returns empty array for empty string', function (assert) {
      assert.deepEqual(keywordAnalyzer(''), []);
    });

    test('returns empty array for whitespace-only input', function (assert) {
      assert.deepEqual(keywordAnalyzer('   '), []);
    });
  });
});
