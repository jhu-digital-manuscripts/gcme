import { module, test } from 'qunit';
import {
  buildTextBlocks,
  numberLabel,
  CHUNK_SIZE,
} from 'gcme-ember/utils/text/sections';
import { LINES, GROUP_TITLES } from '../../../helpers/corpus-fixture';

/**
 * Build the blocks of a group from the fixture corpus.
 *
 * @param {string} groupId
 * @returns {Object}
 */
function blocksFor(groupId) {
  const indices = [];
  LINES.forEach((line, index) => {
    if (line.group.includes(groupId)) {
      indices.push(index);
    }
  });
  return buildTextBlocks({
    lines: LINES,
    indices,
    groupId,
    titles: GROUP_TITLES,
  });
}

/**
 * Every row of a text, in order.
 *
 * @param {Object} text
 * @returns {Array}
 */
function rows(text) {
  return text.blocks.flatMap((block) => block.chunks.flatMap((chunk) => chunk.rows));
}

module('Unit | Utils | text/sections', function () {
  test('a leaf group is one section with no headings', function (assert) {
    const text = blocksFor('GP');

    assert.strictEqual(text.title, 'General Prologoue');
    assert.strictEqual(text.lineCount, 7);
    assert.strictEqual(text.blocks.length, 1);
    assert.deepEqual(text.blocks[0].headings, []);
  });

  test('lines keep corpus order and carry their line index', function (assert) {
    const text = blocksFor('GP');

    assert.deepEqual(
      rows(text).map((row) => row.rawNumber),
      ['1', '2', '3', '4', '5', '5a', '10'],
    );
    assert.deepEqual(
      rows(text).map((row) => row.lineIndex),
      [0, 1, 2, 3, 4, 5, 6],
    );
  });

  test('an intermediate group is split into titled sections', function (assert) {
    const text = blocksFor('CT');

    assert.strictEqual(text.title, 'The Canterbury Tales');
    assert.strictEqual(text.blocks.length, 2, 'one section per text');
    assert.deepEqual(text.blocks[0].headings, [
      { level: 1, title: 'Canterbury Tales - Fragment I' },
      { level: 2, title: 'General Prologoue' },
    ]);
    assert.deepEqual(
      text.blocks[1].headings,
      [{ level: 2, title: "Knight's Tale" }],
      'the fragment is not repeated for the second tale',
    );
  });

  test('rowsByIndex maps a corpus line index to its row', function (assert) {
    const text = blocksFor('CT');
    const row = text.rowsByIndex.get(4);

    assert.strictEqual(row.rawNumber, '5');
    assert.strictEqual(row.text, 'God, that he may');
    assert.strictEqual(text.rowsByIndex.size, text.lineCount);
  });

  test('a row hydrates into the words of its line', function (assert) {
    const row = blocksFor('GP').rowsByIndex.get(4);

    assert.false(row.hydrated, 'lines start as plain text');
    assert.deepEqual(row.words, ['God,', 'that', 'he', 'may']);
  });

  test('every fifth line is numbered, plus section starts and rubrics', function (assert) {
    const gp = rows(blocksFor('GP'));

    assert.deepEqual(
      gp.map((row) => [row.rawNumber, row.label]),
      [
        ['1', '1'],
        ['2', ''],
        ['3', ''],
        ['4', ''],
        ['5', '5'],
        ['5a', ''],
        ['10', '10'],
      ],
      'line 5a shares its number with line 5 and stays unlabelled',
    );

    const knt = rows(blocksFor('KnT'));
    assert.deepEqual(
      knt.map((row) => [row.rawNumber, row.label]),
      [
        ['Rub', 'Rub'],
        ['1', ''],
        ['5', '5'],
      ],
      'the rubric opens the section and is labelled',
    );
  });

  test('numberLabel labels a rubric wherever it appears', function (assert) {
    const seen = new Set([1]);
    const label = numberLabel({ number: -1, raw_number: 'RubA' }, seen, false);

    assert.strictEqual(label, 'RubA');
  });

  test('numberLabel leaves ordinary lines unlabelled', function (assert) {
    const seen = new Set();
    assert.strictEqual(numberLabel({ number: 7, raw_number: '7' }, seen, false), '');
    assert.strictEqual(numberLabel({ number: 10, raw_number: '10' }, seen, false), '10');
    assert.strictEqual(
      numberLabel({ number: 10, raw_number: '10a' }, seen, false),
      '',
      'a second line with the same number is not labelled',
    );
  });

  test('numberLabel labels a starred number on the fifth line', function (assert) {
    // Some Gower lines are numbered `7015*`; they are still the only line
    // carrying that number, so they are labelled.
    const seen = new Set();
    assert.strictEqual(
      numberLabel({ number: 7015, raw_number: '7015*' }, seen, false),
      '7015*',
    );
  });

  test('sections are cut into chunks', function (assert) {
    const lines = [];
    for (let i = 1; i <= CHUNK_SIZE + 5; i++) {
      lines.push({
        id: 'x',
        number: i,
        raw_number: `${i}`,
        group: ['Ch', 'GP'],
        text: `line ${i}`,
        lemma_text: `line ${i}`,
        lemma_tag_text: `line@n ${i}@n`,
      });
    }
    const text = buildTextBlocks({
      lines,
      indices: lines.map((_, i) => i),
      groupId: 'GP',
      titles: {},
    });

    assert.strictEqual(text.blocks.length, 1);
    assert.strictEqual(text.blocks[0].chunks.length, 2);
    assert.strictEqual(text.blocks[0].chunks[0].rows.length, CHUNK_SIZE);
    assert.strictEqual(text.blocks[0].chunks[1].rows.length, 5);
  });

  test('an empty selection produces no blocks', function (assert) {
    const text = buildTextBlocks({
      lines: LINES,
      indices: [],
      groupId: 'GP',
      titles: GROUP_TITLES,
    });

    assert.deepEqual(text.blocks, []);
    assert.strictEqual(text.lineCount, 0);
    assert.strictEqual(text.title, 'General Prologoue');
  });
});
