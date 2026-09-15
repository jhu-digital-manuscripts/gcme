export function isEventedObject(c: any): any;
/**
 *
 * Yielding `timeout(ms)` will pause a task for the duration
 * of time passed in, in milliseconds.
 *
 * This timeout will be scheduled on the Ember runloop, which
 * means that test helpers will wait for it to complete before
 * continuing with the test. See `rawTimeout()` if you need
 * different behavior.
 *
 * The task below, when performed, will print a message to the
 * console every second.
 *
 * ```js
 * export default class MyComponent extends Component {
 *   &#64;task *myTask() {
 *     while (true) {
 *       console.log("Hello!");
 *       yield timeout(1000);
 *     }
 *   }
 * }
 * ```
 *
 * @param {number} ms - the amount of time to sleep before resuming
 *   the task, in milliseconds
 */
export function timeout(ms: number): TimeoutYieldable;
export function deprecatePrivateModule(moduleName: any): void;
export class EmberYieldable extends Yieldable {
    _deferable(): any;
}
declare class TimeoutYieldable extends EmberYieldable {
    constructor(ms: any);
    ms: any;
    onYield(state: any): () => boolean;
}
import { Yieldable } from './external/yieldables';
export {};
//# sourceMappingURL=utils.d.ts.map