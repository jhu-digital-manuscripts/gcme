import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

// The Columns dropdown must show a checkbox beside every toggleable column,
// checked for the visible ones and unchecked for the hidden ones. The stock
// ember-bootstrap-v5 theme names those icons with Font Awesome classes that
// this app does not ship, which rendered them invisible; `service:gcme-table-theme`
// substitutes CSS-drawn icons instead.
module('Integration | models-table columns dropdown', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.themeInstance = this.owner.lookup('service:gcme-table-theme');
    this.data = [{ a: 'a1', b: 'b1' }];
    this.columns = [
      { title: 'Shown', propertyName: 'a' },
      { title: 'Hidden', propertyName: 'b', isHidden: true },
    ];
  });

  test('theme icon classes are self-hosted, not Font Awesome', function (assert) {
    const theme = this.themeInstance;
    for (const icon of [
      theme.columnVisibleIcon,
      theme.columnHiddenIcon,
      theme.caretIcon,
      theme.sortAscIcon,
      theme.sortDescIcon,
    ]) {
      assert.ok(
        /(^|\s)gcme-emt-icon(\s|$)/.test(icon),
        `"${icon}" uses the app's own icon class`,
      );
      assert.notOk(/(^|\s)fa(\s|-)/.test(icon), `"${icon}" is not a Font Awesome class`);
    }
  });

  test('each column option renders a checked or unchecked box', async function (assert) {
    await render(hbs`
      <ModelsTable
        @themeInstance={{this.themeInstance}}
        @data={{this.data}}
        @columns={{this.columns}}
        @showColumnsDropdown={{true}}
        @useFilteringByColumns={{false}}
        @showGlobalFilter={{false}}
        @showComponentFooter={{false}}
      />
    `);

    await click('.columns-dropdown button');

    const items = [...this.element.querySelectorAll('.columns-dropdown .dropdown-item')].filter(
      (el) => ['Shown', 'Hidden'].includes(el.textContent.trim()),
    );
    assert.strictEqual(items.length, 2, 'both columns are listed');

    for (const item of items) {
      const box = item.querySelector('.gcme-emt-icon');
      assert.ok(box, `"${item.textContent.trim()}" has a checkbox icon`);
    }

    assert.dom('.columns-dropdown .gcme-emt-icon-checked').exists(
      { count: 1 },
      'the visible column is checked',
    );
    assert.dom('.columns-dropdown .gcme-emt-icon-unchecked').exists(
      { count: 1 },
      'the hidden column is unchecked',
    );
  });

  test('toggling a column flips its checkbox', async function (assert) {
    await render(hbs`
      <ModelsTable
        @themeInstance={{this.themeInstance}}
        @data={{this.data}}
        @columns={{this.columns}}
        @showColumnsDropdown={{true}}
        @useFilteringByColumns={{false}}
        @showGlobalFilter={{false}}
        @showComponentFooter={{false}}
      />
    `);

    await click('.columns-dropdown button');

    const hiddenOption = [
      ...this.element.querySelectorAll('.columns-dropdown .dropdown-item'),
    ].find((el) => el.textContent.trim() === 'Hidden');

    assert.dom(hiddenOption.querySelector('.gcme-emt-icon')).hasClass('gcme-emt-icon-unchecked');

    await click(hiddenOption);

    assert.dom(hiddenOption.querySelector('.gcme-emt-icon')).hasClass(
      'gcme-emt-icon-checked',
      'checkbox reflects the newly displayed column',
    );
  });

  // Bootstrap 5 draws a caret on `.dropdown-toggle`, which ember-bootstrap
  // always puts on the dropdown button, so the theme's own caret element must
  // stay hidden or the button shows two carets.
  test('the dropdown button shows exactly one caret', async function (assert) {
    await render(hbs`
      <ModelsTable
        @themeInstance={{this.themeInstance}}
        @data={{this.data}}
        @columns={{this.columns}}
        @showColumnsDropdown={{true}}
        @useFilteringByColumns={{false}}
        @showGlobalFilter={{false}}
        @showComponentFooter={{false}}
      />
    `);

    const button = this.element.querySelector('.columns-dropdown button');
    assert.dom(button).hasClass('dropdown-toggle', 'Bootstrap draws its own caret on the button');
    assert.notStrictEqual(
      window.getComputedStyle(button, '::after').content,
      'none',
      "Bootstrap's caret pseudo-element is present",
    );

    const themeCaret = button.querySelector('.gcme-emt-icon-caret');
    assert.ok(themeCaret, 'the theme still renders its caret element');
    assert.strictEqual(
      window.getComputedStyle(themeCaret).display,
      'none',
      'the theme caret is hidden so it does not duplicate the Bootstrap one',
    );
  });

  test('the check is centred in its box and thick enough to read', async function (assert) {
    await render(hbs`
      <ModelsTable
        @themeInstance={{this.themeInstance}}
        @data={{this.data}}
        @columns={{this.columns}}
        @showColumnsDropdown={{true}}
        @useFilteringByColumns={{false}}
        @showGlobalFilter={{false}}
        @showComponentFooter={{false}}
      />
    `);

    await click('.columns-dropdown button');

    const box = this.element.querySelector('.gcme-emt-icon-checked');
    const boxStyle = window.getComputedStyle(box);
    const tick = window.getComputedStyle(box, '::after');
    const px = (v) => parseFloat(v);

    // The tick's ink spans the full pseudo-element box (its left border runs
    // the full height, its bottom border the full width), so it is centred iff
    // that box's centre sits at the centre of the checkbox's padding box.
    const inner = {
      width: px(boxStyle.width) - px(boxStyle.borderLeftWidth) - px(boxStyle.borderRightWidth),
      height: px(boxStyle.height) - px(boxStyle.borderTopWidth) - px(boxStyle.borderBottomWidth),
    };
    assert.ok(px(boxStyle.width) > 0, `checkbox is ${boxStyle.width} wide`);

    // `transform: translate(-50%, -50%) rotate(...)` resolves to a matrix whose
    // translation is half the tick box, so the anchor point is its centre.
    const matrix = new DOMMatrixReadOnly(tick.transform);
    assert.ok(
      Math.abs(matrix.e + px(tick.width) / 2) < 0.5,
      `tick is pulled back by half its width (e=${matrix.e}, width=${tick.width})`,
    );
    assert.ok(
      Math.abs(matrix.f + px(tick.height) / 2) < 0.5,
      `tick is pulled back by half its height (f=${matrix.f}, height=${tick.height})`,
    );

    // ...and that anchor is the centre of the checkbox interior.
    assert.ok(
      Math.abs(px(tick.left) - inner.width / 2) < 0.5,
      `tick anchored at horizontal centre (left=${tick.left}, half of ${inner.width})`,
    );
    assert.ok(
      Math.abs(px(tick.top) - inner.height / 2) < 0.5,
      `tick anchored at vertical centre (top=${tick.top}, half of ${inner.height})`,
    );

    // The rotated tick must still fit inside the box.
    const diagonal = (px(tick.width) + px(tick.height)) / Math.SQRT2;
    assert.ok(
      diagonal < inner.width && diagonal < inner.height,
      `rotated tick (${diagonal.toFixed(2)}px) fits inside the box (${inner.width}px)`,
    );

    // Both strokes are equally weighted and heavier than a hairline.
    assert.strictEqual(
      tick.borderLeftWidth,
      tick.borderBottomWidth,
      'both strokes of the tick are the same weight',
    );
    assert.ok(
      px(tick.borderLeftWidth) >= 2,
      `stroke is ${tick.borderLeftWidth}, at least 2px so it stands out`,
    );
    assert.ok(
      px(tick.borderLeftWidth) > px(boxStyle.borderTopWidth),
      'the tick is bolder than the box outline',
    );
  });
});
