import type { DescriptorData, IDOMElementDescriptor } from './types.js';
/**
 * Given a descriptor or descriptor data, get the single/first element it would
 * match.
 *
 * This is analogous to `querySelector()`, and is meant to be used by DOM helper
 * libraries to resolve the targets of single-element operations.
 *
 * @param target the descriptor or descriptor data
 * @returns the resolved DOM element, or null if no element matched
 */
export declare function resolveDOMElement(target: IDOMElementDescriptor | DescriptorData): Element | null;
/**
 * Given a descriptor or descriptor data, get the elements it would match.
 *
 * This is analogous to `querySelectorAll()`, and is meant to be used by DOM
 * helper libraries to resolve the targets of multi-element operations.
 *
 * @param target the descriptor or descriptor data
 * @returns the resolved DOM elements (possibly none)
 */
export declare function resolveDOMElements(target: IDOMElementDescriptor | DescriptorData): Iterable<Element>;
/**
 * Get the description of the given descriptor or descriptor data, if it has one
 *
 * @param target the descriptor or descriptor data
 * @returns the description or `undefined` if it doesn't have a description
 */
export declare function resolveDescription(target: IDOMElementDescriptor | DescriptorData): string | undefined;
