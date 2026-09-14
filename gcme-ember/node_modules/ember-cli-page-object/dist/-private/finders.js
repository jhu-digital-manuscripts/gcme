import { buildSelector, guardMultiple, findClosestValue } from './helpers.js';
import { getAdapter } from '../adapters/index.js';
import { $ as jQuery } from './jquery.js';
import { throwBetterError, ELEMENT_NOT_FOUND } from './better-errors.js';
import '@ro0gr/ceibo';
import '../adapter.js';
import '../adapters/rfc268.js';
import '@ember/test-helpers';
import '@embroider/macros';

function getContainer(pageObjectNode, options) {
  return options.testContainer || findClosestValue(pageObjectNode, 'testContainer') || getAdapter().testContainer;
}

/**
 * Finds a single element, otherwise fails
 *
 * @private
 */
function findOne(pageObjectNode, targetSelector, options = {}) {
  const selector = buildSelector(pageObjectNode, targetSelector, options);
  const container = getContainer(pageObjectNode, options);
  const elements = jQuery(selector, container).toArray();
  guardMultiple(elements, selector);
  if (elements.length === 0) {
    throwBetterError(pageObjectNode, options.pageObjectKey, ELEMENT_NOT_FOUND, {
      selector
    });
  }
  return elements[0];
}

/**
 * Finds a elements by query
 *
 * @private
 */
function findMany(pageObjectNode, targetSelector, options = {}) {
  const selector = buildSelector(pageObjectNode, targetSelector, options);
  const container = getContainer(pageObjectNode, options);
  return jQuery(selector, container).toArray();
}

/**
 * @private
 * @deprecated
 */
function findElementWithAssert(pageObjectNode, targetSelector, options = {}) {
  const selector = buildSelector(pageObjectNode, targetSelector, options);
  const container = getContainer(pageObjectNode, options);
  let $elements = jQuery(selector, container);
  guardMultiple($elements, selector, options.multiple);
  if ($elements.length === 0) {
    throwBetterError(pageObjectNode, options.pageObjectKey, ELEMENT_NOT_FOUND, {
      selector
    });
  }
  return $elements;
}

/**
 * @private
 * @deprecated
 */
function findElement(pageObjectNode, targetSelector, options = {}) {
  const selector = buildSelector(pageObjectNode, targetSelector, options);
  const container = getContainer(pageObjectNode, options);
  let $elements = jQuery(selector, container);
  guardMultiple($elements, selector, options.multiple);
  return $elements;
}

export { findElement, findElementWithAssert, findMany, findOne };
