import { type IDOMElementDescriptor } from './types.js';
/**
 * Determine if the argument is an {@link IDOMElementDescriptor}.
 *
 * This does not check if the argument is registered, just that it's type is
 * {@link IDOMElementDescriptor}.
 */
export declare function isDescriptor(target: unknown): target is IDOMElementDescriptor;
