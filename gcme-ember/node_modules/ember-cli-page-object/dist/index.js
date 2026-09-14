import { create } from './create.js';
export { create } from './create.js';
import { findOne, findMany } from './-private/finders.js';
export { findElement, findElementWithAssert } from './-private/finders.js';
import { getter } from './macros/getter.js';
import Ceibo from '@ro0gr/ceibo';
import { b as blurrable, c as clickOnText, a as clickable, e as contains, f as fillable, g as focusable, i as isHidden, h as isPresent, j as isVisible, t as text, v as value } from './dsl-e91e58a5.js';
export { b as blurrable, c as clickOnText, a as clickable, e as contains, f as fillable, g as focusable, i as isHidden, h as isPresent, j as isVisible, t as text, v as value } from './dsl-e91e58a5.js';
import { buildSelector, assignDescriptors } from './-private/helpers.js';
export { buildSelector } from './-private/helpers.js';
import { isPageObject, getPageObjectDefinition } from './-private/meta.js';
import { throwBetterError } from './-private/better-errors.js';
import action from './-private/action.js';
import { getAdapter } from './adapters/index.js';
import './-private/run.js';
import 'rsvp';
import './-private/chainable.js';
import './adapter.js';
import './adapters/rfc268.js';
import '@ember/test-helpers';
import './-private/jquery.js';
import '@embroider/macros';
import './-private/element.js';

/**
 * @public
 *
 * Returns the value of an attribute from the matched element
 *
 * @example
 * // <input placeholder="a value">
 *
 * import { create, attribute } from 'ember-cli-page-object';
 *
 * const page = create({
 *   inputPlaceholder: attribute('placeholder', 'input')
 * });
 *
 * assert.equal(page.inputPlaceholder, 'a value');
 *
 * @example
 *
 * // <div><input></div>
 * // <div class="scope"><input placeholder="a value"></div>
 * // <div><input></div>
 *
 * import { create, attribute } from 'ember-cli-page-object';
 *
 * const page = create({
 *   inputPlaceholder: attribute('placeholder', ':input', { scope: '.scope' })
 * });
 *
 * assert.equal(page.inputPlaceholder, 'a value');
 *
 * @example
 *
 * // <div><input></div>
 * // <div class="scope"><input placeholder="a value"></div>
 * // <div><input></div>
 *
 * import { create, attribute } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: 'scope',
 *   inputPlaceholder: attribute('placeholder', ':input')
 * });
 *
 * assert.equal(page.inputPlaceholder, 'a value');
 *
 * @public
 *
 * @param {string} attributeName - Name of the attribute to get
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
function attribute(attributeName, selector, userOptions = {}) {
  return getter(function (key) {
    const element = findOne(this, selector, {
      pageObjectKey: key,
      ...userOptions
    });
    return attr(element, attributeName);
  });
}
const BOOL_ATTRS = ['checked', 'selected', 'async', 'autofocus', 'autoplay', 'controls', 'defer', 'disabled', 'hidden', 'ismap', 'loop', 'multiple', 'open', 'readonly', 'required', 'scoped'];

/**
 * Get `Element` attribute value
 *
 * For backward compatibility reasons we aim to follow the way the `$.attr(` works
 * @see: https://github.com/jquery/jquery/blob/a684e6ba836f7c553968d7d026ed7941e1a612d8/src/attributes/attr.js
 *
 * @param {Element} element
 * @param {string} attributeName
 * @returns string|undefined
 */
function attr(element, attributeName) {
  const value = element.getAttribute(attributeName);
  if (value) {
    // Non-existent attributes return `null`, we normalize to undefined
    return value == null ? undefined : value;
  }
  const attributeNode = element.getAttributeNode(attributeName);
  if (attributeNode) {
    const {
      specified,
      value
    } = attributeNode;
    if (specified && value !== null) {
      const lcAttributeName = attributeName.toLowerCase();
      return BOOL_ATTRS.includes(lcAttributeName) ? lcAttributeName : value;
    }
  }
  return undefined;
}

/**
 * @public
 *
 * Returns the number of elements matched by a selector.
 *
 * @example
 *
 * // <span>1</span>
 * // <span>2</span>
 *
 * import { create, count } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanCount: count('span')
 * });
 *
 * assert.equal(page.spanCount, 2);
 *
 * @example
 *
 * // <div>Text</div>
 *
 * import { create, count } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanCount: count('span')
 * });
 *
 * assert.equal(page.spanCount, 0);
 *
 * @example
 *
 * // <div><span></span></div>
 * // <div class="scope"><span></span><span></span></div>
 *
 * import { create, count } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanCount: count('span', { scope: '.scope' })
 * });
 *
 * assert.equal(page.spanCount, 2)
 *
 * @example
 *
 * // <div><span></span></div>
 * // <div class="scope"><span></span><span></span></div>
 *
 * import { create, count } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   spanCount: count('span')
 * });
 *
 * assert.equal(page.spanCount, 2)
 *
 * @example
 *
 * // <div><span></span></div>
 * // <div class="scope"><span></span><span></span></div>
 *
 * import { create, count } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   spanCount: count('span', { resetScope: true })
 * });
 *
 * assert.equal(page.spanCount, 1);
 *
 * @public
 *
 * @param {string} selector - CSS selector of the element or elements to check
 * @param {Object} options - Additional options
 * @param {string} options.scope - Add scope
 * @param {boolean} options.resetScope - Ignore parent scope
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @return {Descriptor}
 */
function count(selector, userOptions = {}) {
  return getter(function (key) {
    let options = {
      pageObjectKey: key,
      ...userOptions
    };
    return findMany(this, selector, options).length;
  });
}

/**
 * Creates a enumerable that represents a collection of items. The collection is zero-indexed
 * and has the following public methods and properties:
 *
 * - `length` - The number of items in the collection.
 * - `objectAt()` - Returns the page for the item at the specified index.
 * - `filter()` - Filters the items in the array and returns the ones which match the predicate function.
 * - `filterBy()` - Filters the items of the array by the specified property, returning all that are truthy or that match an optional value.
 * - `forEach()` - Runs a function for each item in the collection
 * - `map()` - maps over the elements of the collection
 * - `mapBy()` - maps over the elements of the collecton by the specified property
 * - `findOne()` - finds first item of the array with assert by specified function
 * - `findOneBy()` - finds first item of the array with assert by property
 * - `toArray()` - returns an array containing all the items in the collection
 * - `[Symbol.iterator]()` - if supported by the environment, this allows the collection to be iterated with `for/of` and spread with `...` like a normal array
 *
 * @example
 *
 * // <table>
 * //   <tbody>
 * //     <tr>
 * //       <td>Mary<td>
 * //       <td>Watson</td>
 * //     </tr>
 * //     <tr>
 * //       <td>John<td>
 * //       <td>Doe</td>
 * //     </tr>
 * //   </tbody>
 * // </table>
 *
 * import { create, collection, text } from 'ember-cli-page-object';
 *
 * const page = create({
 *   users: collection('table tr', {
 *     firstName: text('td', { at: 0 }),
 *     lastName: text('td', { at: 1 })
 *   })
 * });
 *
 * assert.equal(page.users.length, 2);
 * assert.equal(page.users.objectAt(1).firstName, 'John');
 * assert.equal(page.users.objectAt(1).lastName, 'Doe');
 *
 * @example
 *
 * // <div class="admins">
 * //   <table>
 * //     <tbody>
 * //       <tr>
 * //         <td>Mary<td>
 * //         <td>Watson</td>
 * //       </tr>
 * //       <tr>
 * //         <td>John<td>
 * //         <td>Doe</td>
 * //       </tr>
 * //     </tbody>
 * //   </table>
 * // </div>
 *
 * // <div class="normal">
 * //   <table>
 * //   </table>
 * // </div>
 *
 * import { create, collection, text } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.admins',
 *
 *   users: collection('table tr', {
 *     firstName: text('td', { at: 0 }),
 *     lastName: text('td', { at: 1 })
 *   })
 * });
 *
 * assert.equal(page.users.length, 2);
 *
 * @example
 *
 * // <table>
 * //   <caption>User Index</caption>
 * //   <tbody>
 * //     <tr>
 * //         <td>Mary<td>
 * //         <td>Watson</td>
 * //       </tr>
 * //       <tr>
 * //         <td>John<td>
 * //         <td>Doe</td>
 * //       </tr>
 * //   </tbody>
 * // </table>
 *
 * import { create, collection, text } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: 'table',
 *
 *   users: collection('tr', {
 *     firstName: text('td', { at: 0 }),
 *     lastName: text('td', { at: 1 }),
 *   })
 * });
 *
 * let john = page.users.filter((item) => item.firstName === 'John' )[0];
 * assert.equal(john.lastName, 'Doe');
 *
 * @example
 * <caption>If the browser you run tests [supports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#Browser_compatibility) Proxy, you can use array accessors to access elements by index</caption>
 *
 * // <table>
 * //   <tr>
 * //       <td>Mary<td>
 * //   </tr>
 * //   <tr>
 * //     <td>John<td>
 * //   </tr>
 * // </table>
 *
 * import { create, collection } from 'ember-cli-page-object';
 *
 * const page = create({
 *   users: collection('tr')
 * });
 *
 * // This only works on browsers that support `Proxy`
 * assert.equal(page.users[0].text, 'Mary');
 * assert.equal(page.users[1].text, 'John');
 *
 *
 * @param {String} scopeOrDefinition - Selector to define the items of the collection
 * @param {Object} [definitionOrNothing] - Object with the definition of item properties
 * @param {boolean} definition.resetScope - Override parent's scope
 * @return {Descriptor}
 */
function collection(scope, definition) {
  if (typeof scope !== 'string') {
    throw new Error('collection requires `scope` as the first argument');
  }
  if (isPageObject(definition)) {
    //extract the stored definition from the page object
    definition = getPageObjectDefinition(definition);
  }
  let descriptor = {
    isDescriptor: true,
    setup(node, key) {
      // Set the value on the descriptor so that it will be picked up and applied by Ceibo.
      // This does mutate the descriptor, but because `setup` is always called before the
      // value is assigned we are guaranteed to get a new, unique Collection instance each time.
      descriptor.value = proxyIfSupported(new Collection(scope, definition, node, key));
    }
  };
  return descriptor;
}
class Collection {
  constructor(scope, definition, parent, key) {
    this.scope = scope;
    this.definition = definition || {};
    this.parent = parent;
    this.key = key;
    this._itemCounter = create({
      count: count(scope, {
        resetScope: this.definition.resetScope,
        testContainer: this.definition.testContainer
      })
    }, {
      parent
    });
    this._items = [];
  }
  get length() {
    return this._itemCounter.count;
  }
  objectAt(index) {
    let {
      key
    } = this;
    if (typeof this._items[index] === 'undefined') {
      let {
        scope,
        definition,
        parent
      } = this;
      let itemScope = buildSelector({}, scope, {
        at: index
      });
      let finalizedDefinition = assignDescriptors({}, definition);
      finalizedDefinition.scope = itemScope;
      let tree = create(finalizedDefinition, {
        parent
      });

      // Change the key of the root node
      Ceibo.meta(tree).key = `${key}[${index}]`;
      this._items[index] = tree;
    }
    return this._items[index];
  }
  filter(...args) {
    return this.toArray().filter(...args);
  }
  filterBy(propertyKey, value) {
    return this.toArray().filter(i => {
      if (typeof value !== 'undefined') {
        return i[propertyKey] === value;
      } else {
        return Boolean(i[propertyKey]);
      }
    });
  }
  forEach(...args) {
    return this.toArray().forEach(...args);
  }
  map(...args) {
    return this.toArray().map(...args);
  }
  mapBy(propertyKey) {
    return this.toArray().map(i => {
      return i[propertyKey];
    });
  }
  findOneBy(...args) {
    const elements = this.filterBy(...args);
    this._assertFoundElements(elements, ...args);
    return elements[0];
  }
  findOne(...args) {
    const elements = this.filter(...args);
    this._assertFoundElements(elements, ...args);
    return elements[0];
  }
  _assertFoundElements(elements, ...args) {
    const argsToText = args.length === 1 ? 'condition' : `${args[0]}: "${args[1]}"`;
    if (elements.length > 1) {
      throwBetterError(this.parent, this.key, `${elements.length} elements found by ${argsToText}, but expected 1`);
    }
    if (elements.length === 0) {
      throwBetterError(this.parent, this.key, `cannot find element by ${argsToText}`);
    }
  }
  toArray() {
    let {
      length
    } = this;
    let array = [];
    for (let i = 0; i < length; i++) {
      array.push(this.objectAt(i));
    }
    return array;
  }
}
if (typeof Symbol !== 'undefined' && Symbol.iterator) {
  Collection.prototype[Symbol.iterator] = function () {
    let i = 0;
    let items = this.toArray();
    let next = () => ({
      done: i >= items.length,
      value: items[i++]
    });
    return {
      next
    };
  };
}
function proxyIfSupported(instance) {
  if (window.Proxy) {
    return new window.Proxy(instance, {
      get: function (target, name) {
        if (typeof name === 'number' || typeof name === 'string') {
          let index = parseInt(name, 10);
          if (!isNaN(index)) {
            return target.objectAt(index);
          }
        }
        return target[name];
      }
    });
  } else {
    return instance;
  }
}

/**
 * Validates if an element or a set of elements have a given CSS class.
 *
 * @example
 *
 * // <em class="lorem"></em><span class="success">Message!</span>
 *
 * import { create, hasClass } from 'ember-cli-page-object';
 *
 * const page = create({
 *   messageIsSuccess: hasClass('success', 'span')
 * });
 *
 * assert.ok(page.messageIsSuccess);
 *
 * @example
 *
 * // <div>
 * //   <span class="lorem"></span>
 * // </div>
 * // <div class="scope">
 * //   <span class="ipsum"></span>
 * // </div>
 *
 * import { create, hasClass } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanHasClass: hasClass('ipsum', 'span', { scope: '.scope' })
 * });
 *
 * assert.ok(page.spanHasClass);
 *
 * @example
 *
 * // <div>
 * //   <span class="lorem"></span>
 * // </div>
 * // <div class="scope">
 * //   <span class="ipsum"></span>
 * // </div>
 *
 * import { create, hasClass } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   spanHasClass: hasClass('ipsum', 'span')
 * });
 *
 * assert.ok(page.spanHasClass);
 *
 * @public
 *
 * @param {string} cssClass - CSS class to be validated
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
function hasClass(cssClass, selector, userOptions = {}) {
  return getter(function (key) {
    let options = {
      pageObjectKey: key,
      ...userOptions
    };
    let element = findOne(this, selector, options);
    return element.classList.contains(cssClass);
  });
}

/**
 * @public
 *
 * Validates if an element or a set of elements don't have a given CSS class.
 *
 * @example
 *
 * // <em class="lorem"></em><span class="success">Message!</span>
 *
 * import { create, notHasClass } from 'ember-cli-page-object';
 *
 * const page = create({
 *   messageIsSuccess: notHasClass('error', 'span')
 * });
 *
 * assert.ok(page.messageIsSuccess);
 *
 * @example
 *
 * // <div>
 * //   <span class="lorem"></span>
 * // </div>
 * // <div class="scope">
 * //   <span class="ipsum"></span>
 * // </div>
 *
 * import { create, notHasClass } from 'ember-cli-page-object';
 *
 * const page = create({
 *   spanNotHasClass: notHasClass('lorem', 'span', { scope: '.scope' })
 * });
 *
 * assert.ok(page.spanNotHasClass);
 *
 * @example
 *
 * // <div>
 * //   <span class="lorem"></span>
 * // </div>
 * // <div class="scope">
 * //   <span class="ipsum"></span>
 * // </div>
 *
 * import { create, notHasClass } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   spanNotHasClass: notHasClass('lorem', 'span')
 * });
 *
 * assert.ok(page.spanNotHasClass);
 *
 * @public
 *
 * @param {string} cssClass - CSS class to be validated
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
function notHasClass(cssClass, selector, userOptions = {}) {
  return getter(function (key) {
    let options = {
      pageObjectKey: key,
      ...userOptions
    };
    let element = findOne(this, selector, options);
    return !element.classList.contains(cssClass);
  });
}

/**
 * @public
 *
 * Returns the value of a property from the matched element.
 *
 * @example
 * // <input type="checkbox" checked="checked">
 *
 * import { create, property } from 'ember-cli-page-object';
 *
 * const page = create({
 *   isChecked: property('checked', 'input')
 * });
 *
 * assert.ok(page.isChecked);
 *
 * @example
 *
 * // <div><input></div>
 * // <div class="scope"><input type="checkbox" checked="checked"></div>
 * // <div><input></div>
 *
 * import { create, property } from 'ember-cli-page-object';
 *
 * const page = create({
 *   isChecked: property('checked', 'input', { scope: '.scope' })
 * });
 *
 * assert.ok(page.isChecked);
 *
 * @public
 *
 * @param {string} propertyName - Name of the property to get
 * @param {string} selector - CSS selector of the element to check
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {boolean} options.resetScope - Override parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @return {Descriptor}
 *
 * @throws Will throw an error if no element matches selector
 * @throws Will throw an error if multiple elements are matched by selector
 */
function property(propertyName, selector, userOptions = {}) {
  return getter(function (key) {
    let options = {
      pageObjectKey: key,
      ...userOptions
    };
    const element = findOne(this, selector, options);
    const propName = normalizePropertyName(propertyName);
    return element[propName];
  });
}
const camelCaseMap = {
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  contenteditable: 'contentEditable'
};
function normalizePropertyName(propertyName) {
  return camelCaseMap[propertyName] ?? propertyName;
}

/**
 *
 * Triggers event on element matched by selector.
 *
 * @example
 *
 * // <input class="name">
 * // <input class="email">
 *
 * import { create, triggerable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   enter: triggerable('keypress', '.name', { eventProperties: { keyCode: 13 } })
 * });
 *
 * // triggers keypress using enter key on element with selector '.name'
 * await page.enter();
 *
 * @example
 *
 * // <input class="name">
 * // <input class="email">
 *
 * import { create, triggerable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   keydown: triggerable('keypress', '.name')
 * });
 *
 * // triggers keypress using enter key on element with selector '.name'
 * await page.keydown({ which: 13 });
 *
 * @example
 *
 * // <div class="scope">
 * //   <input class="name">
 * // </div>
 * // <input class="email">
 *
 * import { create, triggerable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   keydown: triggerable('keypress', '.name', { scope: '.scope' })
 * });
 *
 * // triggers keypress using enter key on element with selector '.name'
 * await page.keydown({ which: 13 });
 *
 * @example
 *
 * // <div class="scope">
 * //   <input class="name">
 * // </div>
 * // <input class="email">
 *
 * import { create, triggerable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   scope: '.scope',
 *   keydown: triggerable('keypress', '.name')
 * });
 *
 * // triggers keypress using enter key on element with selector '.name'
 * await page.keydown({ which: 13 });
 *
 * @public
 *
 * @param {string} event - Event to be triggered
 * @param {string} selector - CSS selector of the element on which the event will be triggered
 * @param {Object} options - Additional options
 * @param {string} options.scope - Nests provided scope within parent's scope
 * @param {number} options.at - Reduce the set of matched elements to the one at the specified index
 * @param {boolean} options.resetScope - Ignore parent scope
 * @param {string} options.testContainer - Context where to search elements in the DOM
 * @param {string} options.eventProperties - Event properties that will be passed to trigger function
 * @return {Descriptor}
 */
function triggerable(event, selector, userOptions = {}) {
  const {
    eventProperties: initialEventProperties
  } = userOptions;
  return action({
    ...userOptions,
    selector
  }, function (eventProperties = {}) {
    const mergedEventProperties = {
      ...initialEventProperties,
      ...eventProperties
    };
    const element = findOne(this, selector, userOptions);
    return getAdapter().triggerEvent(element, event, mergedEventProperties);
  });
}

function fillInDynamicSegments(path, params) {
  return path.split('/').map(function (segment) {
    let match = segment.match(/^:(.+)$/);
    if (match) {
      let [, key] = match;
      let value = params[key];
      if (typeof value === 'undefined') {
        throw new Error(`Missing parameter for '${key}'`);
      }

      // Remove dynamic segment key from params
      delete params[key];
      return encodeURIComponent(value);
    }
    return segment;
  }).join('/');
}
function addValue(urlSearchParams, key, value, parentKey = '', isArrayValue = false) {
  let keyWithParent = parentKey ? `${parentKey}[${key}]` : key;
  if (Array.isArray(value)) {
    // array
    value.forEach(arrayItem => addValue(urlSearchParams, key, arrayItem, parentKey, true));
  } else if (typeof value === 'object' && value !== null) {
    // object
    Object.keys(value).forEach(_key => addValue(urlSearchParams, _key, value[_key], keyWithParent));
  } else {
    // primitive
    if (isArrayValue) {
      urlSearchParams.append(`${keyWithParent}[]`, value);
    } else {
      urlSearchParams.append(keyWithParent, value);
    }
  }
  return urlSearchParams;
}
function appendQueryParams(path, queryParams) {
  let keys = Object.keys(queryParams);
  if (keys.length) {
    let urlSearchParams = keys.reduce((urlSearchParams, key) => addValue(urlSearchParams, key, queryParams[key]), new URLSearchParams());
    path += `?${urlSearchParams}`;
  }
  return path;
}

/**
 * @public
 *
 * Loads a given route.
 *
 * The resulting descriptor can be called with dynamic segments and parameters.
 *
 * @example
 *
 * import { create, visitable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   visit: visitable('/users')
 * });
 *
 * // visits '/users'
 * await page.visit();
 *
 * @example
 *
 * import { create, visitable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   visit: visitable('/users/:user_id')
 * });
 *
 * // visits '/users/10'
 * await page.visit({ user_id: 10 });
 *
 * @example
 *
 * import { create, visitable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   visit: visitable('/users')
 * });
 *
 * // visits '/users?name=john'
 * await page.visit({ name: 'john' });
 *
 * @example
 *
 * import { create, visitable } from 'ember-cli-page-object';
 *
 * const page = create({
 *   visit: visitable('/users/:user_id')
 * });
 *
 * // visits '/users/1?name=john'
 * await page.visit({ user_id: 1, name: 'john' });
 *
 * @param {string} path - Full path of the route to visit
 * @return {Descriptor}
 *
 * @throws Will throw an error if dynamic segments are not filled.
 *         Note: An error instance may contain a `cause.error` property
 *         with the original error thrown by an underlying test helper.
 */
function visitable(path) {
  return action(function (dynamicSegmentsAndQueryParams = {}) {
    let params = {
      ...dynamicSegmentsAndQueryParams
    };
    let fullPath = fillInDynamicSegments(path, params);
    fullPath = appendQueryParams(fullPath, params);
    return getAdapter().visit(fullPath).catch(e => {
      throw new Error(`Failed to visit URL '${fullPath}': ${e.toString()}`, {
        cause: e
      });
    });
  });
}

const selectable = fillable;
var index = {
  attribute,
  blurrable,
  clickOnText,
  clickable,
  collection,
  contains,
  count,
  create,
  fillable,
  focusable,
  hasClass,
  isHidden,
  isPresent,
  isVisible,
  notHasClass,
  property,
  selectable,
  text,
  value,
  visitable,
  triggerable
};

export { attribute, collection, count, index as default, hasClass, notHasClass, property, selectable, triggerable, visitable };
