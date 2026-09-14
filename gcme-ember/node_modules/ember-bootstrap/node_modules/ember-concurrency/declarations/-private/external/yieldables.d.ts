/**
 * Yielding `animationFrame()` will pause a task until after the next animation
 * frame using the native `requestAnimationFrame()` browser API.
 *
 * The task below, when performed, will print the time since the last loop run
 * for every animation frame.
 *
 * ```js
 * export default class MyComponent extends Component {
 *   &#64;task *myTask() {
 *     let lastNow = performance.now();
 *     while (true) {
 *       yield animationFrame();
 *
 *       let now = performance.now();
 *       let dt = now - lastNow;
 *       lastNow = now;
 *
 *       console.log(dt);
 *     }
 *   }
 * }
 * ```
 */
export function animationFrame(): AnimationFrameYieldable;
/**
 *
 * Yielding `rawTimeout(ms)` will pause a task for the duration
 * of time passed in, in milliseconds.
 *
 * The timeout will use the native `setTimeout()` browser API,
 * instead of the Ember runloop, which means that test helpers
 * will *not* wait for it to complete.
 *
 * The task below, when performed, will print a message to the
 * console every second.
 *
 * ```js
 * export default class MyComponent extends Component {
 *   &#64;task *myTask() {
 *     while (true) {
 *       console.log("Hello!");
 *       yield rawTimeout(1000);
 *     }
 *   }
 * }
 * ```
 *
 * @param {number} ms - the amount of time to sleep before resuming
 *   the task, in milliseconds
 */
export function rawTimeout(ms: number): RawTimeoutYieldable;
export const cancelableSymbol: "__ec_cancel__";
export const yieldableSymbol: "__ec_yieldable__";
export const YIELDABLE_CONTINUE: "next";
export const YIELDABLE_THROW: "throw";
export const YIELDABLE_RETURN: "return";
export const YIELDABLE_CANCEL: "cancel";
/**
 * Yieldables are a primitive for building safe, cancelation-aware ways to
 * instrument and introspect the runtime of a task. Many Yieldables are built-in
 * to ember-concurrency today, such as `timeout`, `animationFrame`, and
 * `rawTimeout`.
 *
 * For example, if I wanted to implement a yieldable for `requestIdleCallback`,
 * I could do the following:
 *
 * ```javascript
 * import Component from '@glimmer/component';
 * import { task, Yieldable } from 'ember-concurrency';
 *
 * class IdleCallbackYieldable extends Yieldable {
 *   onYield(state) {
 *     let callbackId = requestIdleCallback(() => state.next());
 *
 *     return () => cancelIdleCallback(callbackId);
 *   }
 * }
 *
 * const idleCallback = () => new IdleCallbackYieldable();
 *
 * class MyComponent extends Component {
 *   &#64;task *backgroundTask() {
 *     while (1) {
 *       yield idleCallback();
 *
 *       const data = this.complicatedNumberCrunching();
 *       yield this.sendData(data);
 *     }
 *   }
 * }
 * ```
 *
 * In general, `Yieldable` instances **should** be reusable across calls, and thus
 * care should be taken to ensure that teardown is provided and state not
 * intended to be shared across calls stay inside `onYield`.
 *
 * `Yieldable` also provides automatic Promise-casting.
 *
 * <style>
 *   .ignore-this--this-is-here-to-hide-constructor,
 *   #Yieldable { display: none }
 * </style>
 *
 * @class Yieldable
 */
export class Yieldable {
    /**
     * Defines what happens when the task encounters `yield myYieldable` and returns
     * a disposer function that handles any cleanup.
     *
     * The state parameter is provided by the runtime, and provides operations for
     * interacting with the yielding task instance and advancing, returning,
     * throwing, or canceling its execution.
     *
     * @method onYield
     * @memberof Yieldable
     * @param {YieldableState} state
     * @instance
     * @public
     */
    public onYield(): void;
    _deferable(): {
        resolve: undefined;
        reject: undefined;
    };
    _toPromise(): any;
    /**
     * Returns a promise that resolves with the value yielded back to or returned
     * to the yielded task, or rejects with either the exception thrown from the
     * Yieldable, or an error with a `.name` property with value `"TaskCancelation"`.
     *
     * @method then
     * @memberof Yieldable
     * @instance
     * @return {Promise}
     */
    then(...args: any[]): Promise<any>;
    /**
     * @method catch
     * @memberof Yieldable
     * @instance
     * @return {Promise}
     */
    catch(...args: any[]): Promise<any>;
    /**
     * @method finally
     * @memberof Yieldable
     * @instance
     * @return {Promise}
     */
    finally(...args: any[]): Promise<any>;
    __ec_yieldable__: any;
}
/**
 *
 * Yielding `forever` will pause a task indefinitely until
 * it is cancelled (i.e. via host object destruction, the restartable modifier,
 * or manual cancellation).
 *
 * This is often useful in cases involving animation: if you're
 * using Liquid Fire, or some other animation scheme, sometimes you'll
 * notice buttons visibly reverting to their inactive states during
 * a route transition. By yielding `forever` in a Component task that drives a
 * button's active state, you can keep a task indefinitely running
 * until the animation runs to completion.
 *
 * NOTE: Liquid Fire also includes a useful `waitUntilIdle()` method
 * on the `liquid-fire-transitions` service that you can use in a lot
 * of these cases, but it won't cover cases of asynchrony that are
 * unrelated to animation, in which case `forever` might be better suited
 * to your needs.
 *
 * ```js
 * import { task, forever } from 'ember-concurrency';
 * export default class MyComponent extends Component {
 *   &#64;service myService;
 *   &#64;task *myTask() {
 *     yield this.myService.doSomethingThatCausesATransition();
 *     yield forever;
 *   }
 * }
 * ```
 */
export const forever: ForeverYieldable;
declare class AnimationFrameYieldable extends Yieldable {
    onYield(state: any): () => void;
}
declare class RawTimeoutYieldable extends Yieldable {
    constructor(ms: any);
    ms: any;
    onYield(state: any): () => void;
}
declare class ForeverYieldable extends Yieldable {
}
export {};
//# sourceMappingURL=yieldables.d.ts.map