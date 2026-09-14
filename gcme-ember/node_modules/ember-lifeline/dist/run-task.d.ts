import { Destroyable, TaskOrName, Timer } from "./types/index";
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
declare function runTask(destroyable: Destroyable, taskOrName: TaskOrName, timeout?: number): Timer;
export { runTask };
