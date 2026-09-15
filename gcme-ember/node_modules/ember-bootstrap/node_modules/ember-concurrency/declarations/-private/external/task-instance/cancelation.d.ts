/**
 * Returns true if the object passed to it is a TaskCancelation error.
 * If you call `someTask.perform().catch(...)` or otherwise treat
 * a {@linkcode TaskInstance} like a promise, you may need to
 * handle the cancelation of a TaskInstance differently from
 * other kinds of errors it might throw, and you can use this
 * convenience function to distinguish cancelation from errors.
 *
 * ```js
 * click() {
 *   this.myTask.perform().catch(e => {
 *     if (!didCancel(e)) { throw e; }
 *   });
 * }
 * ```
 *
 * @param {object} error the caught error, which might be a TaskCancelation
 * @returns {boolean}
 */
export function didCancel(e: any): boolean;
export const TASK_CANCELATION_NAME: "TaskCancelation";
export const CANCEL_KIND_EXPLICIT: "explicit";
export const CANCEL_KIND_YIELDABLE_CANCEL: "yielded";
export const CANCEL_KIND_LIFESPAN_END: "lifespan_end";
export const CANCEL_KIND_PARENT_CANCEL: "parent_cancel";
export class CancelRequest {
    constructor(kind: any, reason: any);
    kind: any;
    reason: any;
    promise: Promise<any>;
    finalize: (value: any) => void;
}
//# sourceMappingURL=cancelation.d.ts.map