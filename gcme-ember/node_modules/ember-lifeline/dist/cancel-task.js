import { cancel } from '@ember/runloop';
import { registerDestructor } from '@ember/destroyable';

const NULL_TIMER_ID = -1;
/**
 * A map of instances/timers that allows us to
 * store cancelIds for scheduled timers per instance.
 *
 * @private
 */

let registeredTimers = new WeakMap();
/**
 * Test use only. Allows for swapping out the WeakMap to a Map, giving
 * us the ability to detect whether the timers set is empty.
 *
 * @private
 * @param {*} mapForTesting A map used to ensure correctness when testing.
 */

function _setRegisteredTimers(mapForTesting) {
  registeredTimers = mapForTesting;
}
function getTimersDisposable(destroyable, timers) {
  return function () {
    timers.forEach(cancelId => {
      cancelTask(destroyable, cancelId);
    });
    timers.clear();
  };
}
function getTimers(destroyable) {
  let timers = registeredTimers.get(destroyable);

  if (!timers) {
    timers = new Set();
    registeredTimers.set(destroyable, timers);
    registerDestructor(destroyable, getTimersDisposable(destroyable, timers));
  }

  return timers;
}
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

function cancelTask(destroyable, cancelId) {
  let timers = getTimers(destroyable);
  timers.delete(cancelId);
  cancel(cancelId);
}

export { NULL_TIMER_ID, _setRegisteredTimers, cancelTask, getTimers, getTimersDisposable };
