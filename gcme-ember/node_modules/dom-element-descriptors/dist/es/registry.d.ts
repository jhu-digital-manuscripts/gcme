import type { IDOMElementDescriptor, DescriptorData } from './types.js';
/**
 * Register or explicitly unregister descriptor data.
 *
 * Note that descriptor data does not need to be unregistered, the
 * un-registration functionality exists for cases when the descriptor is known
 * to no longer be valid.
 *
 * @param descriptor the DOM element descriptor
 * @param data the descriptor's data, or null to un-register
 */
export declare function registerDescriptorData(descriptor: IDOMElementDescriptor, data: DescriptorData | null): void;
/**
 * Look up registered descriptor data
 *
 * @param descriptor the descriptor
 * @returns the descriptor's data, or null if none is set
 */
export declare function lookupDescriptorData(descriptor: IDOMElementDescriptor): DescriptorData | null;
