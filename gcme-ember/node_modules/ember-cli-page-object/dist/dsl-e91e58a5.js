import action from './-private/action.js';
import { findOne, findMany } from './-private/finders.js';
import { getAdapter } from './adapters/index.js';
import { containsText, isVisible as isVisible$1, text as text$1 } from './-private/element.js';
import { getter } from './macros/getter.js';
import '@ro0gr/ceibo';
import { guardMultiple, getRoot } from './-private/helpers.js';

/**
 * @public
 *
 * Allow to perform operations on intermediate results within the chain.
 *
 * Useful for grouping what's being tested.
 *
 * @example
 * page.users(1).as(user => {
 *   assert.equal(user.name, 'John');
 *   assert.equal(user.lastName, 'Doe');
 *   assert.equal(user.email, 'john@doe');
 * });
 *
 * page.users(2).as(user => {
 *   assert.equal(user.name, 'John');
 *   assert.equal(user.lastName, 'Doe');
 *   assert.equal(user.email, 'john@doe');
 * });
 *
 * page.users(3).as(user => {
 *   assert.equal(user.name, 'John');
 *   assert.equal(user.lastName, 'Doe');
 *   assert.equal(user.email, 'john@doe');
 * });
 *
 * @example
 * // Lorem <span>ipsum <strong>dolor</strong></span>
 *
 * let page = create({
 *   scope: 'span',
 *   foo: {
 *     bar: {
 *       scope: 'strong'
 *     }
 *   }
 * });
 *
 * page.foo.bar.as(element => {
 *   assert.equal(element.text, 'dolor');
 * });
 *
 * @param {function} callback - Function to be called with the current object as the parameter
 * @return {object} this
 *
 */
function as(callback) {
  callback(this);
  return this;
}

/**
 *
 * Blurs element matched by selector.
 *
 * @example
 *
 * // <input class="name">
 * // <input class="email">
 *
 * import { create, blurrable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   blur: blurrable('.name')
 * });
 *
 * // blurs on element with selector '.name'
 * await page.blur();
 *
 * @example
 *
 * // <div class="scope">
 * //   <input class="name">
 * // </div>
 * // <input class="email">
 *
 * import { create, blurrable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   blur: blurrable('.name', { scope: '.scope' })
 * });
 *
 * // blurs on element with selector '.scope .name'
 * await page.blur();
 *
 * @example
 *
 * // <div class="scope">
 * //   <input class="name">
 * // </div>
 * // <input class="email">
 *
 * import { create, blurrable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   blur: blurrable('.name')
 * });
 *
 * // blurs on element with selector '.scope .name'
 * await page.blur();
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element which will be blurred
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {boolean} options.resetScope - Ignore parent scope
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 */
function blurrable(selector = '', userOptions = {}) {
  return action({
    ...userOptions,
    selector
  }, function () {
    const element = findOne(this, selector, userOptions);
    return getAdapter().blur(element);
  });
}

/**
 * Clicks elements matched by a selector.
 *
 * @example
 *
 * // <button class="continue">Continue<button>
 * // <button>Cancel</button>
 *
 * import { create, clickable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   continue: clickable('button.continue')
 * });
 *
 * // clicks on element with selector 'button.continue'
 * await page.continue();
 *
 * @example
 *
 * // <div class="scope">
 * //   <button>Continue<button>
 * // </div>
 * // <button>Cancel</button>
 *
 * import { create, clickable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   continue: clickable('button.continue', { scope: '.scope' })
 * });
 *
 * // clicks on element with selector '.scope button.continue'
 * await page.continue();
 *
 * @example
 *
 * // <div class="scope">
 * //   <button>Continue<button>
 * // </div>
 * // <button>Cancel</button>
 *
 * import { create, clickable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   continue: clickable('button.continue')
 * });
 *
 * // clicks on element with selector '.scope button.continue'
 * await page.continue();
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element to click
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {boolean} options.visible - Make the action to raise an error if the element is not visible
 * @param {boolean} options.resetScope - Ignore parent scope
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 */
function clickable(selector, userOptions = {}) {
  return action({
    ...userOptions,
    selector
  }, function () {
    const element = findOne(this, selector, userOptions);
    return getAdapter().click(element);
  });
}

/**
 * Clicks on an element containing specified text.
 *
 * The element can either match a specified selector,
 * or be inside an element matching the specified selector.
 *
 * @example
 *
 * // <fieldset>
 * //  <button>Lorem</button>
 * //  <button>Ipsum</button>
 * // </fieldset>
 *
 * import { create, clickOnText } from 'ember-cli-page-object';
 *
 * const page = create({
 *   clickOnFieldset: clickOnText('fieldset'),
 *   clickOnButton: clickOnText('button')
 * });
 *
 * // queries the DOM with selector 'fieldset :contains("Lorem"):last'
 * await page.clickOnFieldset('Lorem');
 *
 * // queries the DOM with selector 'button:contains("Ipsum")'
 * await page.clickOnButton('Ipsum');
 *
 * @example
 *
 * // <div class="scope">
 * //   <fieldset>
 * //    <button>Lorem</button>
 * //    <button>Ipsum</button>
 * //   </fieldset>
 * // </div>
 *
 * import { create, clickOnText } from 'ember-cli-page-object';
 *
 * const page = create({
 *   clickOnFieldset: clickOnText('fieldset', { scope: '.scope' }),
 *   clickOnButton: clickOnText('button', { scope: '.scope' })
 * });
 *
 * // queries the DOM with selector '.scope fieldset :contains("Lorem"):last'
 * await page.clickOnFieldset('Lorem');
 *
 * // queries the DOM with selector '.scope button:contains("Ipsum")'
 * page.clickOnButton('Ipsum');
 *
 * @example
 *
 * // <div class="scope">
 * //   <fieldset>
 * //    <button>Lorem</button>
 * //    <button>Ipsum</button>
 * //   </fieldset>
 * // </div>
 *
 * import { create, clickOnText } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   clickOnFieldset: clickOnText('fieldset'),
 *   clickOnButton: clickOnText('button')
 * });
 *
 * // queries the DOM with selector '.scope fieldset :contains("Lorem"):last'
 * await page.clickOnFieldset('Lorem');
 *
 * // queries the DOM with selector '.scope button:contains("Ipsum")'
 * await page.clickOnButton('Ipsum');
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element in which to look for text
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {boolean} options.visible - Make the action to raise an error if the element is not visible
 * @param {boolean} options.resetScope - Override parent's scope
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 */
function clickOnText(selector, userOptions = {}) {
  return action({
    ...userOptions,
    selector
  }, function (textToClick) {
    const options = {
      ...userOptions,
      contains: textToClick,
      // find the deepest node containing a text to click
      last: true
    };
    const childSelector = `${selector || ''} *`;
    const byTextSelector = findMany(this, childSelector, options).length ? childSelector : selector;
    const element = findOne(this, byTextSelector, options);
    return getAdapter().click(element);
  });
}

/**
 * Returns a boolean representing whether an element or a set of elements contains the specified text.
 *
 * @example
 *
 * // Lorem <span>ipsum</span>
 *
 * import { create, contains } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanContains: contains('span')
 * });
 *
 * assert.ok(page.spanContains('ipsum'));
 *
 * @example
 *
 * // <div><span>lorem</span></div>
 * // <div class="scope"><span>ipsum</span></div>
 * // <div><span>dolor</span></div>
 *
 * import { create, contains } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanContains: contains('span', { scope: '.scope' })
 * });
 *
 * assert.notOk(page.spanContains('lorem'));
 * assert.ok(page.spanContains('ipsum'));
 *
 * @example
 *
 * // <div><span>lorem</span></div>
 * // <div class="scope"><span>ipsum</span></div>
 * // <div><span>dolor</span></div>
 *
 * import { create, contains } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   spanContains: contains('span')
 * });
 *
 * assert.notOk(page.spanContains('lorem'));
 * assert.ok(page.spanContains('ipsum'));
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element to check
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {boolean} options.resetScope - Override parent's scope
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 *
 * @throws Will throw an error if no element matches selector
 * @throws Will throw an error if multiple elements are matched by selector
 */
function contains(selector, userOptions = {}) {
  return getter(function (key) {
    return function (textToSearch) {
      let options = {
        pageObjectKey: `${key}("${textToSearch}")`,
        ...userOptions
      };
      const element = findOne(this, selector, options);
      return containsText(element, textToSearch);
    };
  });
}

/**
 * Alias for `fillable`, which works for inputs, HTML select menus, and
 * contenteditable elements.
 *
 * [See `fillable` for usage examples.](#fillable)
 *
 * @name selectable
 * @function
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element to look for text
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {boolean} options.resetScope - Override parent's scope
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 */

/**
 * Fills in an input matched by a selector.
 *
 * @example
 *
 * // <input value="">
 *
 * import { create, fillable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   fillIn: fillable('input')
 * });
 *
 * // result: <input value="John Doe">
 * await page.fillIn('John Doe');
 *
 * @example
 *
 * // <div class="name">
 * //   <input value="">
 * // </div>
 * // <div class="last-name">
 * //   <input value= "">
 * // </div>
 *
 * import { create, fillable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   fillInName: fillable('input', { scope: '.name' })
 * });
 *
 * await page.fillInName('John Doe');
 *
 * // result
 * // <div class="name">
 * //   <input value="John Doe">
 * // </div>
 *
 * @example
 *
 * // <div class="name">
 * //   <input value="">
 * // </div>
 * // <div class="last-name">
 * //   <input value= "">
 * // </div>
 *
 * import { create, fillable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: 'name',
 *   fillInName: fillable('input')
 * });
 *
 * await page.fillInName('John Doe');
 *
 * // result
 * // <div class="name">
 * //   <input value="John Doe">
 * // </div>
 *
 * @example <caption>Filling different inputs with the same property</caption>
 *
 * // <input id="name">
 * // <input name="lastname">
 * // <input data-test="email">
 * // <textarea aria-label="address"></textarea>
 * // <input placeholder="phone">
 * // <div contenteditable="true" id="bio"></div>
 *
 * const page = create({
 *   fillIn: fillable('input, textarea, [contenteditable]')
 * });
 *
 * await page
 *   .fillIn('name', 'Doe')
 *   .fillIn('lastname', 'Doe')
 *   .fillIn('email', 'john@doe')
 *   .fillIn('address', 'A street')
 *   .fillIn('phone', '555-000')
 *   .fillIn('bio', 'The story of <b>John Doe</b>');
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element to look for text
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {boolean} options.resetScope - Override parent's scope
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 */
function fillable(selector = '', userOptions = {}) {
  return action({
    ...userOptions,
    selector
  }, function (contentOrClue, content) {
    let clue;
    if (content === undefined) {
      content = contentOrClue;
    } else {
      clue = contentOrClue;
    }
    let scopeSelector = selector;
    if (clue) {
      scopeSelector = findSelectorByClue(this, selector, userOptions, clue);
      if (!scopeSelector) {
        throw new Error(`Can not find element by clue: "${clue}".`);
      }
    }
    const element = findOne(this, scopeSelector, userOptions);
    return getAdapter().fillIn(element, content);
  });
}
function findSelectorByClue(node, selector, findOptions, clue) {
  let cssClues = ['input', 'textarea', 'select', '[contenteditable]'].map(tag => [`${tag}[data-test="${clue}"]`, `${tag}[aria-label="${clue}"]`, `${tag}[placeholder="${clue}"]`, `${tag}[name="${clue}"]`, `${tag}#${clue}`]).reduce((total, other) => total.concat(other), []);
  return cssClues.find(extraScope => {
    return findMany(node, `${selector} ${extraScope}`, findOptions)[0];
  });
}

/**
 *
 * Focuses element matched by selector.
 *
 * @example
 *
 * // <input class="name">
 * // <input class="email">
 *
 * import { create, focusable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   focus: focusable('.name')
 * });
 *
 * // focuses on element with selector '.name'
 * await page.focus();
 *
 * @example
 *
 * // <div class="scope">
 * //   <input class="name">
 * // </div>
 * // <input class="email">
 *
 * import { create, focusable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   focus: focusable('.name', { scope: '.scope' })
 * });
 *
 * // focuses on element with selector '.scope .name'
 * await page.focus();
 *
 * @example
 *
 * // <div class="scope">
 * //   <input class="name">
 * // </div>
 * // <input class="email">
 *
 * import { create, focusable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   focus: focusable('.name')
 * });
 *
 * // focuses on element with selector '.scope .name'
 * await page.focus();
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element which will be focused
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {boolean} options.resetScope - Ignore parent scope
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 */
function focusable(selector = '', userOptions = {}) {
  const query = {
    ...userOptions,
    selector
  };
  return action(query, function () {
    const element = findOne(this, selector, query);
    return getAdapter().focus(element);
  });
}

/**
 * Validates if an element or set of elements is hidden or does not exist in the DOM.
 *
 * @example
 *
 * // Lorem <span style="display:none">ipsum</span>
 *
 * import { create, isHidden } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanIsHidden: isHidden('span')
 * });
 *
 * assert.ok(page.spanIsHidden);
 *
 * @example
 *
 * // Lorem <strong>ipsum</strong>
 *
 * import { create, isHidden } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanIsHidden: isHidden('span')
 * });
 *
 * // returns true when element doesn't exist in DOM
 * assert.ok(page.spanIsHidden);
 *
 * @example
 *
 * // <div><span>lorem</span></div>
 * // <div class="scope"><span style="display:none">ipsum</span></div>
 * // <div><span>dolor</span></div>
 *
 * import { create, isHidden } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scopedSpanIsHidden: isHidden('span', { scope: '.scope' })
 * });
 *
 * assert.ok(page.scopedSpanIsHidden);
 *
 * @example
 *
 * // <div><span>lorem</span></div>
 * // <div class="scope"><span style="display:none">ipsum</span></div>
 * // <div><span>dolor</span></div>
 *
 * import { create, isHidden } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   scopedSpanIsHidden: isHidden('span')
 * });
 *
 * assert.ok(page.scopedSpanIsHidden);
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element to check
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {boolean} options.resetScope - Override parent's scope
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 *
 * @throws Will throw an error if multiple elements are matched by selector
 */
function isHidden(selector, userOptions = {}) {
  return getter(function (key) {
    let options = {
      pageObjectKey: key,
      ...userOptions
    };
    let elements = findMany(this, selector, options);
    guardMultiple(elements, selector);
    return elements.length === 0 || !isVisible$1(elements[0]);
  });
}

/**
 * Validates if any element matching the target selector is rendered in the DOM.
 *
 * `isPresent` vs. `isVisible`:
 *   - Both validate that an element matching the target selector can be found in the DOM
 *   - `isVisible` additionally validates that all matching elements are visible
 *
 * Some uses cases for `isPresent` over `isVisible`:
 *   - To check for the presence of a tag that is never visible in the DOM (e.g. `<meta>`).
 *   - To validate that, even though an element may not currently be visible, it is still in the DOM.
 *   - To validate that an element has not merely been hidden but has in fact been removed from the DOM.
 *
 * @example
 *
 * // Lorem <span>ipsum</span>
 *
 * import { create, isPresent } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanIsPresent: isPresent('span')
 * });
 *
 * assert.ok(page.spanIsPresent);
 *
 * @example
 *
 * // <head>
 * //   <meta name='robots' content='noindex'>
 * // </head>
 *
 * import { create, isPresent } from 'ember-cli-page-object';
 *
 * const page = create({
 *   notIndexed: isPresent(`meta[name='robots'][content='noindex']`, {
 *     testContainer: 'head'
 *   })
 * });
 *
 * assert.ok(page.notIndexed);
 *
 * @example
 *
 * // Lorem <strong>ipsum</strong>
 *
 * import { create, isPresent } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanIsPresent: isPresent('span')
 * });
 *
 * // returns false when element doesn't exist in DOM
 * assert.notOk(page.spanIsPresent);
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element to check
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {boolean} options.resetScope - Override parent's scope
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 *
 * @throws Will throw an error if multiple elements are matched by selector
 */
function isPresent(selector, userOptions = {}) {
  return getter(function (key) {
    let options = {
      pageObjectKey: key,
      ...userOptions
    };
    let elements = findMany(this, selector, options);
    guardMultiple(elements, selector);
    return elements.length === 1;
  });
}

/**
 * Validates if an element or set of elements are visible.
 *
 * @example
 *
 * // Lorem <span>ipsum</span>
 *
 * import { create, isVisible } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanIsVisible: isVisible('span')
 * });
 *
 * assert.ok(page.spanIsVisible);
 *
 * @example
 *
 * // Lorem <strong>ipsum</strong>
 *
 * import { create, isVisible } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanIsVisible: isVisible('span')
 * });
 *
 * // returns false when element doesn't exist in DOM
 * assert.notOk(page.spanIsVisible);
 *
 * @example
 *
 * // <div>
 * //   <span style="display:none">lorem</span>
 * // </div>
 * // <div class="scope">
 * //   <span>ipsum</span>
 * // </div>
 *
 * import { create, isVisible } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanIsVisible: isVisible('span', { scope: '.scope' })
 * });
 *
 * assert.ok(page.spanIsVisible);
 *
 * @example
 *
 * // <div>
 * //   <span style="display:none">lorem</span>
 * // </div>
 * // <div class="scope">
 * //   <span>ipsum</span>
 * // </div>
 *
 * import { create, isVisible } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   spanIsVisible: isVisible('span')
 * });
 *
 * assert.ok(page.spanIsVisible);
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element to check
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {boolean} options.resetScope - Override parent's scope
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 *
 * @throws Will throw an error if multiple elements are matched by selector
 */
function isVisible(selector, userOptions = {}) {
  return getter(function (key) {
    let options = {
      pageObjectKey: key,
      ...userOptions
    };
    let elements = findMany(this, selector, options, options.multiple);
    guardMultiple(elements, selector);
    return elements.length === 1 && isVisible$1(elements[0]);
  });
}

function identity(v) {
  return v;
}

/**
 * @public
 *
 * Returns text of the element or Array of texts of all matched elements by selector.
 *
 * @example
 *
 * // Hello <span>world!</span>
 *
 * import { create, text } from 'ember-cli-page-object';
 *
 * const page = create({
 *   text: text('span')
 * });
 *
 * assert.equal(page.text, 'world!');
 *
 * @example
 *
 * // <div><span>lorem</span></div>
 * // <div class="scope"><span>ipsum</span></div>
 * // <div><span>dolor</span></div>
 *
 * import { create, text } from 'ember-cli-page-object';
 *
 * const page = create({
 *   text: text('span', { scope: '.scope' })
 * });
 *
 * assert.equal(page.text, 'ipsum');
 *
 * @example
 *
 * // <div><span>lorem</span></div>
 * // <div class="scope"><span>ipsum</span></div>
 * // <div><span>dolor</span></div>
 *
 * import { create, text } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   text: text('span')
 * });
 *
 * // returns 'ipsum'
 * assert.equal(page.text, 'ipsum');
 *
 * @example
 *
 * // <div><span>lorem</span></div>
 * // <div class="scope">
 * //  ipsum
 * // </div>
 * // <div><span>dolor</span></div>
 *
 * import { create, text } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   text: text('span', { normalize: false })
 * });
 *
 * // returns 'ipsum'
 * assert.equal(page.text, '\n ipsum\n');
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element to check
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {boolean} options.resetScope - Override parent's scope
 * @param {boolean} options.normalize - Set to `false` to avoid text normalization
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 *
 * @throws Will throw an error if no element matches selector
 * @throws Will throw an error if multiple elements are matched by selector
 */
function text(selector, userOptions = {}) {
  return getter(function (key) {
    let options = {
      pageObjectKey: key,
      ...userOptions
    };
    let f = options.normalize === false ? identity : normalizeText;
    return f(text$1(findOne(this, selector, options)));
  });
}

/**
 * @private
 *
 * Trim whitespaces at both ends and normalize whitespaces inside `text`
 *
 * Due to variations in the HTML parsers in different browsers, the text
 * returned may vary in newlines and other white space.
 *
 * @see http://api.jquery.com/text/
 */
function normalizeText(text) {
  return text.trim().replace(/\n/g, ' ').replace(/\s\s*/g, ' ');
}

/**
 * @public
 *
 * Returns the value of a matched element, or an array of values of all
 * matched elements. If a matched element is contenteditable, this helper
 * will return the html content of the element.
 *
 * @example
 *
 * // <input value="Lorem ipsum">
 *
 * import { create, value } from 'ember-cli-page-object';
 *
 * const page = create({
 *   value: value('input')
 * });
 *
 * assert.equal(page.value, 'Lorem ipsum');
 *
 * @example
 *
 * // <div contenteditable="true"><b>Lorem ipsum</b></div>
 *
 * import { create, value } from 'ember-cli-page-object';
 *
 * const page = create({
 *   value: value('[contenteditable]')
 * });
 *
 * assert.equal(page.value, '<b>Lorem ipsum</b>');
 *
 * @example
 *
 * // <div><input value="lorem"></div>
 * // <div class="scope"><input value="ipsum"></div>
 *
 * import { create, value } from 'ember-cli-page-object';
 *
 * const page = create({
 *   value: value('input', { scope: '.scope' })
 * });
 *
 * assert.equal(page.value, 'ipsum');
 *
 * @example
 *
 * // <div><input value="lorem"></div>
 * // <div class="scope"><input value="ipsum"></div>
 *
 * import { create, value } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   value: value('input')
 * });
 *
 * assert.equal(page.value, 'ipsum');
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element to check
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {boolean} options.resetScope - Override parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 *
 * @throws Will throw an error if no element matches selector
 * @throws Will throw an error if multiple elements are matched by selector
 */
function value(selector, userOptions = {}) {
  return getter(function (key) {
    let options = {
      pageObjectKey: key,
      ...userOptions
    };
    const element = findOne(this, selector, options);
    return element.hasAttribute('contenteditable') ? element.innerHTML : getValue(element);
  });
}
function getValue(element) {
  const {
    value
  } = element;
  if (value !== undefined && element.tagName.toLowerCase() === 'select') {
    return selectValue(element);
  }
  return element.value;
}
function selectValue(element) {
  const selectedOptions = Array.from(element.selectedOptions).filter(option => !option.disabled && (option.parentNode.tagName.toLowerCase() !== 'optgroup' || !option.parentNode.disabled));
  if (element.multiple) {
    return selectedOptions.map(option => option.value);
  } else if (selectedOptions.length === 0) {
    return null;
  }
  return element.value;
}

const thenDescriptor = {
  isDescriptor: true,
  value() {
    const root = getRoot(this);
    const chainedRoot = root._chainedTree || root;
    return chainedRoot._promise.then(...arguments);
  }
};
const dsl = {
  as,
  blur: blurrable(),
  click: clickable(),
  clickOn: clickOnText(),
  contains: contains(),
  fillIn: fillable(),
  focus: focusable(),
  isHidden: isHidden(),
  isPresent: isPresent(),
  isVisible: isVisible(),
  select: fillable(),
  text: text(),
  then: thenDescriptor,
  value: value()
};

export { clickable as a, blurrable as b, clickOnText as c, dsl as d, contains as e, fillable as f, focusable as g, isPresent as h, isHidden as i, isVisible as j, text as t, value as v };
