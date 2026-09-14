import { later } from '@ember/runloop';
import { isDestroying } from '@ember/destroyable';
import getTask from './utils/get-task.js';
import { NULL_TIMER_ID, getTimers } from './cancel-task.js';

/**
 * Registers and runs the provided task function for the provided object at the specified
 * timeout (defaulting to 0). The timer is properly canceled if the object is destroyed
 * before it is invoked.
 *
 * Example:
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { runTask } from 'ember-lifeline';
 *
 * export default RunComponent extends Component {
 *   start() {
 *     runTask(this, () => {
 *       console.log('This runs after 5 seconds if this component is still displayed');
 *     }, 5000)
 *   },
 * });
 * ```
 *
 * @function runTask
 * @param { Destroyable } destroyable the instance to register the task for
 * @param { Function | String } taskOrName a function representing the task, or string
 *                                         specifying a property representing the task,
 *                                         which is run at the provided time specified
 *                                         by timeout
 * @param { Number } [timeout=0] the time in the future to run the task
 * @public
 */

function runTask(destroyable, taskOrName, timeout = 0) {
  if (isDestroying(destroyable)) {
    return NULL_TIMER_ID;
  }

  let task = getTask(destroyable, taskOrName, 'runTask');
  let timers = getTimers(destroyable);
  let cancelId = later(() => {
    timers.delete(cancelId);
    task.call(destroyable);
  }, timeout);
  timers.add(cancelId);
  return cancelId;
}

export { runTask };
