import { module, test } from 'qunit';
import {
  buildWordInfo,
  baseLemmaTag,
  dictWord,
  splitDefinition,
  stripPunctuation,
  tokenize,
} from 'gcme-ember/utils/corpus/word-info';
import { LINES, WORD_DICT, LEMMA_TAG_DICT } from '../../../helpers/corpus-fixture';

function maps() {
  return {
    wordDictMap: new Map(WORD_DICT.map((e) => [e.word, e])),
    lemmaTagDictMap: new Map(LEMMA_TAG_DICT.map((e) => [e.lemma_tag, e])),
  };
}

/** The fixture line `God, that he may`. */
const GOD_LINE = LINES[4];

/** The rubric line whose words are untagged. */
const RUBRIC_LINE = LINES[7];

module('Unit | Utils | corpus/word-info', function () {
  test('tokenize splits on whitespace and tolerates empty values', function (assert) {
    assert.deepEqual(tokenize('a b  c'), ['a', 'b', 'c']);
    assert.deepEqual(tokenize(''), []);
    assert.deepEqual(tokenize(null), []);
    assert.deepEqual(tokenize('   '), []);
  });

  test('every fixture line has aligned text, lemma, and tagged lemma tokens', function (assert) {
    for (const line of LINES) {
      const words = tokenize(line.text).length;
      assert.strictEqual(tokenize(line.lemma_text).length, words, line.raw_number);
      assert.strictEqual(tokenize(line.lemma_tag_text).length, words, line.raw_number);
    }
  });

  test('stripPunctuation removes edge punctuation only', function (assert) {
    assert.strictEqual(stripPunctuation('God,'), 'God');
    assert.strictEqual(stripPunctuation('"I'), 'I');
    assert.strictEqual(stripPunctuation('to-day'), 'to-day');
    assert.strictEqual(stripPunctuation('(+),'), '');
  });

  test('dictWord prefers the spelling the dictionary knows', function (assert) {
    const { wordDictMap } = maps();
    assert.strictEqual(dictWord('God,', wordDictMap), 'god');
    assert.strictEqual(dictWord('God', wordDictMap), 'god');
    assert.strictEqual(dictWord('Shoures', wordDictMap), 'shoures');
    assert.strictEqual(dictWord('Unknown,', wordDictMap), 'unknown');
  });

  test('baseLemmaTag drops the inflection and variant parts', function (assert) {
    assert.strictEqual(baseLemmaTag('shour@n%pl'), 'shour@n');
    assert.strictEqual(baseLemmaTag('engelond@n#propn'), 'engelond@n');
    assert.strictEqual(baseLemmaTag('mouen@v3%pr_1'), 'mouen@v3');
    assert.strictEqual(baseLemmaTag('god@n1'), 'god@n1');
    assert.strictEqual(baseLemmaTag(''), '');
  });

  test('splitDefinition separates the dictionary headword from the gloss', function (assert) {
    const split = splitDefinition('shour n.\t"shower, rain storm," s.v. shower sb. OED.');
    assert.strictEqual(split.head, 'shour n.');
    assert.strictEqual(split.gloss, '"shower, rain storm," s.v. shower sb. OED.');

    assert.deepEqual(splitDefinition('no tab here'), { head: '', gloss: 'no tab here' });
    assert.strictEqual(splitDefinition(null), null);
    assert.strictEqual(splitDefinition(''), null);
  });

  test('buildWordInfo describes a word from its aligned tokens', function (assert) {
    const info = buildWordInfo({ line: GOD_LINE, tokenIndex: 0, ...maps() });

    assert.strictEqual(info.display, 'God,', 'the word as printed');
    assert.strictEqual(info.word, 'god', 'the dictionary spelling');
    assert.strictEqual(info.lemma, 'god');
    assert.strictEqual(info.lemmaTag, 'god@n1');
    assert.strictEqual(info.tag, 'n1');
    assert.true(info.concorded);
    assert.strictEqual(info.definition.head, 'God, god n.(1)');
  });

  test('buildWordInfo takes the definition of the inflected tagged lemma', function (assert) {
    const info = buildWordInfo({ line: GOD_LINE, tokenIndex: 3, ...maps() });

    assert.strictEqual(info.display, 'may');
    assert.strictEqual(info.lemmaTag, 'mouen@v3%pr_1', 'inflection is kept');
    assert.strictEqual(info.definition.head, 'mouen v.(3)');
  });

  test('buildWordInfo lists the other senses of the same spelling', function (assert) {
    const info = buildWordInfo({ line: GOD_LINE, tokenIndex: 3, ...maps() });

    assert.deepEqual(
      info.otherSenses.map((sense) => sense.lemmaTag),
      ['mai@n1'],
      'the sense used by this line is not repeated',
    );
    assert.strictEqual(info.otherSenses[0].definition.head, 'mai n.(1)');
  });

  test('buildWordInfo reports an untagged word', function (assert) {
    const info = buildWordInfo({ line: RUBRIC_LINE, tokenIndex: 0, ...maps() });

    assert.strictEqual(info.display, 'Incipit');
    assert.false(info.concorded);
    assert.strictEqual(info.lemma, '');
    assert.strictEqual(info.lemmaTag, '');
    assert.strictEqual(info.definition, null);
  });

  test('buildWordInfo returns null outside the line', function (assert) {
    assert.strictEqual(buildWordInfo({ line: GOD_LINE, tokenIndex: 9, ...maps() }), null);
    assert.strictEqual(buildWordInfo({ line: GOD_LINE, tokenIndex: -1, ...maps() }), null);
    assert.strictEqual(buildWordInfo({ line: null, tokenIndex: 0, ...maps() }), null);
  });
});
