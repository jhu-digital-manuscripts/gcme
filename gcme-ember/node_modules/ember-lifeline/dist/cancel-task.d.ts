/// <reference types="ember__runloop" />
import { EmberRunTimer } from '@ember/runloop/types';
import { Destroyable, MapLike } from "./types/index";
declare const NULL_TIMER_ID = -1;
/**
 * Test use only. Allows for swapping out the WeakMap to a Map, giving
 * us the ability to detect whether the timers set is empty.
 *
 * @private
 * @param {*} mapForTesting A map used to ensure correctness when testing.
 */
declare function _setRegisteredTimers(mapForTesting: MapLike<Destroyable, Set<EmberRunTimer>>): void;
declare function getTimersDisposable(destroyable: Destroyable, timers: Set<EmberRunTimer>): () => void;
declare function getTimers(destroyable: Destroyable): Set<EmberRunTimer>;
/**
 * Cancel a previously scheduled task.
 *
 * Example:
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { runTask, cancelTask } from 'ember-lifeline';
 *
 * export default CancelableComponent extends Component {
 *   start() {
 *     this._cancelId = runTask(this, () => {
 *       console.log('This runs after 5 seconds if this component is still displayed');
 *     }, 5000)
 *   },
 *
 *   disable() {
 *     cancelTask(this, this._cancelId);
 *   },
 * }
 * ```
 *
 * @function cancelTask
 * @param { Destroyable } destroyable the entangled object that was provided with the original *Task call
 * @param { Number } cancelId the id returned from the *Task call
 * @public
 */
declare function cancelTask(destroyable: Destroyable, cancelId: EmberRunTimer): void | undefined;
export { NULL_TIMER_ID, _setRegisteredTimers, getTimersDisposable, getTimers, cancelTask };
