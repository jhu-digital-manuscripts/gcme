/// <reference types="ember-source/types/preview/@ember/component/-private/signature-utils" />
/// <reference types="ember-source/types/preview/@ember/component/helper" />
import type { Task } from '../index';
type TaskParams = [task: Task<any, any[]>, ...args: any[]];
declare const _default: import("@ember/component/helper").FunctionBasedHelper<{
    Args: {
        Positional: TaskParams;
        Named: import("@ember/component/helper").EmptyObject;
    };
    Return: any;
}>;
export default _default;
//# sourceMappingURL=task.d.ts.map