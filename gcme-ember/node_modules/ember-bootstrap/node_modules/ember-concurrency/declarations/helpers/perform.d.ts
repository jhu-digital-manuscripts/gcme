/// <reference types="ember-source/types/preview/@ember/component/helper" />
import type { Task } from '../index';
type PerformParams = [task: Task<any, any[]>, ...args: any[]];
export declare function performHelper(args: PerformParams, hash: any): (...innerArgs: any[]) => any;
declare const _default: import("@ember/component/helper").FunctionBasedHelper<{
    Args: {
        Positional: PerformParams;
        Named: any;
    };
    Return: (...innerArgs: any[]) => any;
}>;
export default _default;
//# sourceMappingURL=perform.d.ts.map