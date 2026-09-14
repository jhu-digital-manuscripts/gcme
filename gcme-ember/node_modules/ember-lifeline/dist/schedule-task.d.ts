import { Destroyable, EmberRunQueues, TaskOrName, Timer } from "./types/index";
/**
 * Adds the provided function to the named queue for the provided object. The timer is
 * properly canceled if the object is destroyed before it is invoked.
 *
 * Example:
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { scheduleTask } from 'ember-lifeline';
 *
 * export default ScheduledComponent extends Component {
 *   start() {
 *     scheduleTask(this, 'actions', () => {
 *       console.log('This runs at the end of the run loop (via the actions queue) if this component is still displayed');
 *     })
 *   },
 * });
 * ```
 *
 * @function scheduleTask
 * @param { Destroyable } destroyable the instance to register the task for
 * @param { String } queueName the queue to schedule the task into
 * @param { Function | String } taskOrName a function representing the task, or string
 *                                         specifying a property representing the task,
 *                                         which is run at the provided time specified
 *                                         by timeout
 * @param { ...* } args arguments to pass to the task
 * @public
 */
declare function scheduleTask(destroyable: Destroyable, queueName: EmberRunQueues, taskOrName: TaskOrName, ...args: any[]): Timer;
export { scheduleTask };
