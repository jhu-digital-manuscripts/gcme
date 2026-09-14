import type { Arguments, ComponentManager, ComponentCapabilities } from '@glimmer/interfaces';
import { type default as BaseComponent } from './component';
export interface Constructor<T> {
    new (owner: unknown, args: Record<string, unknown>): T;
}
export default abstract class BaseComponentManager<GlimmerComponent extends BaseComponent> implements ComponentManager<GlimmerComponent> {
    abstract capabilities: ComponentCapabilities;
    private owner;
    constructor(owner: unknown);
    createComponent(ComponentClass: Constructor<GlimmerComponent>, args: Arguments): GlimmerComponent;
    getContext(component: GlimmerComponent): GlimmerComponent;
}
