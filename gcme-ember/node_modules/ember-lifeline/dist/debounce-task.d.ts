import { Destroyable } from "./types/index";
/**
 * Runs the function with the provided name after the timeout has expired on the last
 * invocation. The timer is properly canceled if the object is destroyed before it is
 * invoked.
 *
 * Example:
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { debounceTask } from 'ember-lifeline';
 *
 * export default LoggerComponent extends Component {
 *   logMe() {
 *     console.log('This will only run once every 300ms.');
 *   },
 *
 *   click() {
 *     debounceTask(this, 'logMe', 300);
 *   },
 * }
 * ```
 *
 * @function debounceTask
 * @param { Destroyable } destroyable the instance to register the task for
 * @param { String } name the name of the task to debounce
 * @param { ...* } debounceArgs arguments to pass to the debounced method
 * @param { Number } spacing the amount of time to wait before calling the method (in milliseconds)
 * @param { Boolean } [immediate] Trigger the function on the leading instead of the trailing edge of the wait interval. Defaults to false.
 * @public
 */
declare function debounceTask(destroyable: Destroyable, name: string, ...debounceArgs: any[]): void | undefined;
/**
 * Cancel a previously debounced task.
 *
 * Example:
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { debounceTask, cancelDebounce } from 'ember-lifeline';
 *
 * export default LoggerComponent extends Component {
 *   logMe() {
 *     console.log('This will only run once every 300ms.');
 *   },
 *
 *   click() {
 *     debounceTask(this, 'logMe', 300);
 *   },
 *
 *   disable() {
 *      cancelDebounce(this, 'logMe');
 *   },
 * }
 * ```
 *
 * @function cancelDebounce
 * @param { Destroyable } destroyable the instance to register the task for
 * @param { String } methodName the name of the debounced method to cancel
 * @public
 */
declare function cancelDebounce(destroyable: Destroyable, methodName: string): void | undefined;
export { debounceTask, cancelDebounce };
