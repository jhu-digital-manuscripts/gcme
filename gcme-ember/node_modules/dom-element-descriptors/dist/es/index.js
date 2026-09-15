const IS_DESCRIPTOR = '__dom_element_descriptor_is_descriptor__';

/**
 * Determine if the argument is an {@link IDOMElementDescriptor}.
 *
 * This does not check if the argument is registered, just that it's type is
 * {@link IDOMElementDescriptor}.
 */
function isDescriptor(target) {
    return Boolean(typeof target === 'object' && target && IS_DESCRIPTOR in target);
}

/**
 * Get the registry instance.
 *
 * We store it on the window to ensure that if some dependency/hoisting horkage
 * results in the presence of multiple copies of this library, they are all
 * using the same registry.
 *
 * @returns the registry
 */
function getRegistry() {
    const win = window;
    win.domElementDescriptorsRegistry =
        win.domElementDescriptorsRegistry || new WeakMap();
    return win.domElementDescriptorsRegistry;
}
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
function registerDescriptorData(descriptor, data) {
    if (data) {
        getRegistry().set(descriptor, data);
    }
    else {
        getRegistry().delete(descriptor);
    }
}
/**
 * Look up registered descriptor data
 *
 * @param descriptor the descriptor
 * @returns the descriptor's data, or null if none is set
 */
function lookupDescriptorData(descriptor) {
    return getRegistry().get(descriptor) || null;
}

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
function resolveDOMElement(target) {
    let data = isDescriptor(target) ? lookupDescriptorData(target) : target;
    if (!data) {
        return null;
    }
    if (data.element !== undefined) {
        return data.element;
    }
    else {
        for (let element of data.elements || []) {
            return element;
        }
        return null;
    }
}
/**
 * Given a descriptor or descriptor data, get the elements it would match.
 *
 * This is analogous to `querySelectorAll()`, and is meant to be used by DOM
 * helper libraries to resolve the targets of multi-element operations.
 *
 * @param target the descriptor or descriptor data
 * @returns the resolved DOM elements (possibly none)
 */
function resolveDOMElements(target) {
    let data = isDescriptor(target) ? lookupDescriptorData(target) : target;
    if (!data) {
        return [];
    }
    if (data.elements) {
        return Array.from(data.elements);
    }
    else {
        let element = data.element;
        return element ? [element] : [];
    }
}
/**
 * Get the description of the given descriptor or descriptor data, if it has one
 *
 * @param target the descriptor or descriptor data
 * @returns the description or `undefined` if it doesn't have a description
 */
function resolveDescription(target) {
    let data = isDescriptor(target) ? lookupDescriptorData(target) : target;
    return data?.description;
}

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
function createDescriptor(data) {
    let descriptor = {
        [IS_DESCRIPTOR]: true,
    };
    registerDescriptorData(descriptor, data);
    return descriptor;
}

export { IS_DESCRIPTOR, createDescriptor, isDescriptor, lookupDescriptorData, registerDescriptorData, resolveDOMElement, resolveDOMElements, resolveDescription };
//# sourceMappingURL=index.js.map
