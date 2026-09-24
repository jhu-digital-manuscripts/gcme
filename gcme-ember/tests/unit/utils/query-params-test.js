import { module, test } from 'qunit';
import {
  encodeList,
  decodeList,
  decodeInteger,
} from 'gcme-ember/utils/query-params';

module('Unit | Utils | query-params', function () {
  test('encodeList joins plain values with commas', function (assert) {
    assert.strictEqual(encodeList(['god', 'man']), 'god,man');
  });

  test('encodeList returns the empty string for an empty or missing list', function (assert) {
    assert.strictEqual(encodeList([]), '');
    assert.strictEqual(encodeList(null), '');
    assert.strictEqual(encodeList(undefined), '');
  });

  test('encodeList drops empty items', function (assert) {
    assert.strictEqual(encodeList(['god', '', null, 'man']), 'god,man');
  });

  test('decodeList returns an empty list for empty values', function (assert) {
    assert.deepEqual(decodeList(''), []);
    assert.deepEqual(decodeList(null), []);
    assert.deepEqual(decodeList(undefined), []);
  });

  test('values containing commas and percents round-trip', function (assert) {
    // `word_dict` holds words such as `he,` and `(+),`, and tagged lemmas
    // such as `mouen@v3%pr_1` contain a percent sign.
    const items = ['he,', '(+),', 'mouen@v3%pr_1', '100%', ',leading'];
    assert.deepEqual(decodeList(encodeList(items)), items);
  });

  test('encoded values keep the readable form for ordinary words', function (assert) {
    assert.strictEqual(encodeList(['whan', 'that']), 'whan,that');
    assert.deepEqual(decodeList('whan,that'), ['whan', 'that']);
  });

  test('decodeInteger falls back for missing and invalid values', function (assert) {
    assert.strictEqual(decodeInteger('3', 1), 3);
    assert.strictEqual(decodeInteger(7, 1), 7);
    assert.strictEqual(decodeInteger('', 1), 1);
    assert.strictEqual(decodeInteger(null, 1), 1);
    assert.strictEqual(decodeInteger('abc', 1), 1);
    assert.strictEqual(decodeInteger('0', 1), 1);
    assert.strictEqual(decodeInteger('-4', 1), 1);
  });
});
