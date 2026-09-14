const TASK_CANCELATION_NAME = 'TaskCancelation';

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
function didCancel(e) {
  return e && e.name === TASK_CANCELATION_NAME;
}
const CANCEL_KIND_EXPLICIT = 'explicit';
const CANCEL_KIND_YIELDABLE_CANCEL = 'yielded';
const CANCEL_KIND_LIFESPAN_END = 'lifespan_end';
const CANCEL_KIND_PARENT_CANCEL = 'parent_cancel';
class CancelRequest {
  constructor(kind, reason) {
    this.kind = kind;
    this.reason = reason;
    this.promise = new Promise(resolve => {
      this.finalize = resolve;
    });
  }
}

export { CANCEL_KIND_EXPLICIT, CANCEL_KIND_LIFESPAN_END, CANCEL_KIND_PARENT_CANCEL, CANCEL_KIND_YIELDABLE_CANCEL, CancelRequest, TASK_CANCELATION_NAME, didCancel };
//# sourceMappingURL=cancelation.js.map
