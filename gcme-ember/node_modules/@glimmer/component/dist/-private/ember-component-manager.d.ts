import BaseComponentManager from './base-component-manager';
import { type default as GlimmerComponent } from './component';
import type { Arguments } from '@glimmer/interfaces';
/**
 * This component manager runs in Ember.js environments and extends the base component manager to:
 *
 * 1. Properly destroy the component's associated `meta` data structure
 * 2. Schedule destruction using Ember's runloop
 */
declare class EmberGlimmerComponentManager extends BaseComponentManager<GlimmerComponent> {
    capabilities: any;
    destroyComponent(component: GlimmerComponent): void;
}
interface EmberGlimmerComponentManager {
    updateComponent?: (component: GlimmerComponent, args: Arguments) => void;
}
export default EmberGlimmerComponentManager;
