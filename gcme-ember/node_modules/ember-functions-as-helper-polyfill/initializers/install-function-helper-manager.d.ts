import type { Arguments } from '../-private/local-glimmer-interfaces-types';
export declare function initialize(): void;
declare const _default: {
    initialize: typeof initialize;
};
export default _default;
type AnyFunction = (...args: any[]) => unknown;
interface State {
    fn: AnyFunction;
    args: Arguments;
}
export declare class FunctionHelperManager {
    capabilities: any;
    createHelper(fn: AnyFunction, args: Arguments): State;
    getValue({ fn, args }: State): unknown;
    getDebugName(fn: AnyFunction): string;
}
