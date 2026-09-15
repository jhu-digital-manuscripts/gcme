/// <reference types="ember-source/types/preview/@ember/component/-private/signature-utils" />
/// <reference types="ember-source/types/preview/@ember/component/helper" />
import type { Task } from '../index';
type CancelAllParams = [task: Task<any, any[]>];
export declare function cancelHelper(args: CancelAllParams): (...innerArgs: any[]) => any;
declare const _default: import("@ember/component/helper").FunctionBasedHelper<{
    Args: {
        Positional: CancelAllParams;
        Named: import("@ember/component/helper").EmptyObject;
    };
    Return: (...innerArgs: any[]) => any;
}>;
export default _default;
//# sourceMappingURL=cancel-all.d.ts.map