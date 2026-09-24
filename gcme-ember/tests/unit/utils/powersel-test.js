import { module, test } from 'qunit';
import { flattenOptions } from 'gcme-ember/utils/powersel';

const DATA = [
  {
    groupName: 'Geoffrey Chaucer',
    options: [
      { id: 'Ch', label: 'Geoffrey Chaucer' },
      {
        groupName: 'The Canterbury Tales',
        options: [
          { id: 'CT', label: 'The Canterbury Tales' },
          {
            groupName: 'Canterbury Tales - Fragment I',
            options: [
              { id: 'Frag1', label: 'Canterbury Tales - Fragment I' },
              { id: 'GP', label: 'General Prologoue' },
              { id: 'KnT', label: "Knight's Tale" },
            ],
          },
        ],
      },
    ],
  },
];

module('Unit | Utils | powersel', function () {
  test('flattenOptions collects options at every depth', function (assert) {
    const map = flattenOptions(DATA);

    assert.deepEqual(
      [...map.keys()].sort(),
      ['CT', 'Ch', 'Frag1', 'GP', 'KnT'],
      'every option id is present',
    );
    assert.strictEqual(map.get('KnT').label, "Knight's Tale");
  });

  test('flattenOptions returns the option objects themselves', function (assert) {
    const map = flattenOptions(DATA);
    const nested = DATA[0].options[1].options[1].options[2];

    assert.strictEqual(map.get('KnT'), nested);
  });

  test('flattenOptions tolerates missing data', function (assert) {
    assert.strictEqual(flattenOptions(null).size, 0);
    assert.strictEqual(flattenOptions(undefined).size, 0);
    assert.strictEqual(flattenOptions([]).size, 0);
    assert.strictEqual(flattenOptions([null, { groupName: 'x' }]).size, 0);
  });
});
