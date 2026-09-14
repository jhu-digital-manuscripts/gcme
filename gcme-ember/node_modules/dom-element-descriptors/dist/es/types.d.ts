export declare const IS_DESCRIPTOR = "__dom_element_descriptor_is_descriptor__";
/**
 * A DOM element descriptor.
 *
 * This is a "no-op interface" used just to support typing. We don't want to
 * require any properties on DOM element descriptors, and any object can
 * theoretically be one (and can be implicitly cast to one), so this interface
 * exists so the typings can be clear about when arguments/return values are
 * treated as DOM element descriptors, and so implementations can indicate that
 * they are DOM element descriptors. We need the `[IS_DESCRIPTOR]` property so
 * everthing object isn't implicitly cast-able to `IDOMElementDescriptor`, which
 * would severely undercut the value of our typings.
 */
export interface IDOMElementDescriptor {
    readonly [IS_DESCRIPTOR]: any;
}
interface BaseData {
    description?: string;
}
interface ElementRequired extends BaseData {
    element: Element | null;
    elements?: Iterable<Element>;
}
interface ElementsRequired extends BaseData {
    element?: Element | null;
    elements: Iterable<Element>;
}
/**
 * Descriptor data
 *
 * The data associated with/resolved from a DOM element descriptor at a
 * particular moment in time
 */
export type DescriptorData = ElementRequired | ElementsRequired;
export {};
