import { type DescriptorData, type IDOMElementDescriptor } from './types.js';
/**
 * Create a descriptor from descriptor data
 *
 * This is a convenience method for creating a descriptor associated with some
 * descriptor data. This is intended for cases where a consumer of a DOM helper
 * library want to create an ad-hoc descriptor from an element or list of
 * elements to pass to a DOM helper.
 *
 * @param data the descriptor data
 * @returns a new DOM element descriptor associated with the descriptor data
 *
 * @example
 *
 * let element = someOtherLibrary.getGraphElement();
 * let descriptor = createDescriptor({ element, description: 'graph element' });
 *
 * await click(descriptor);
 * assert.dom(descriptor).hasClass('selected');
 */
export declare function createDescriptor(data: DescriptorData): IDOMElementDescriptor;
