import { Destroyable, Timer } from "./types/index";
/**
 * Runs the function with the provided name immediately, and only once in the time window
 * specified by the spacing argument.
 *
 * Example:
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { throttleTask } from 'ember-lifeline';
 *
 * export default LoggerComponent extends Component {
 *   logMe() {
 *     console.log('This will run once immediately, then only once every 300ms.');
 *   },
 *
 *   click() {
 *     throttleTask(this, 'logMe', 300);
 *   },
 * });
 * ```
 *
 * @function throttleTask
 * @param { Destroyable } destroyable the instance to register the task for
 * @param { String } taskName the name of the task to throttle
 * @param { ...* } [throttleArgs] arguments to pass to the throttled method
 * @param { Number } spacing the time in the future to run the task
 * @param { Boolean } [immediate] Trigger the function on the leading instead of the trailing edge of the wait interval. Defaults to true.
 * @public
 */
declare function throttleTask(destroyable: Destroyable, taskName: any, ...throttleArgs: any[]): Timer;
export { throttleTask };
