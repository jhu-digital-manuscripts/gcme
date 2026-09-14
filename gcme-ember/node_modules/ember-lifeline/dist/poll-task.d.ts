import { MapLike, TaskOrName, Destroyable, Token } from "./types/index";
/**
 * Test use only. Allows for swapping out the WeakMap to a Map, giving
 * us the ability to detect whether the pollers set is empty.
 *
 * @private
 * @param {*} mapForTesting A map used to ensure correctness when testing.
 */
declare function _setRegisteredPollers(mapForTesting: MapLike<Destroyable, Set<Token>>): void | undefined;
/**
 * Allows for overriding of the polling behavior to explicitly control
 * whether polling should occur or not.
 *
 * @param { Function } callback
 * @public
 */
declare function setShouldPoll(callback: Function): void;
declare function getQueuedPollTasks(): Map<Token, () => void>;
/**
 * Sets up a function that can perform polling logic in a testing safe way.
 * The task is invoked synchronously with an argument (generally called `next`).
 * In normal development/production when `next` is invoked, it will trigger the
 * task again (recursively). However, when in test mode the recursive polling
 * functionality is disabled, and usage of the `pollTaskFor` helper is required.
 *
 * Example:
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { pollTask, runTask } from 'ember-lifeline';
 *
 * export default PollingComponent extends Component {
 *   api: injectService(),
 *
 *   init() {
 *     this._super(...arguments);
 *
 *     let token = pollTask(this, (next) => {
 *       this.get('api').request('get', 'some/path')
 *         .then(() => {
 *           runTask(this, next, 1800);
 *         })
 *     });
 *
 *     this._pollToken = token;
 *   },
 * });
 * ```
 *
 * Test Example:
 *
 * ```js
 * import { settled } from '@ember/test-helpers';
 * import { pollTaskFor } from 'ember-lifeline';
 *
 *
 * test('foo-bar watches things', async function(assert) {
 *   await render(hbs`{{foo-bar}}`);
 *
 *   assert.strictEqual(serverRequests, 1, 'called initially');
 *
 *   pollTaskFor(this._pollToken);
 *
 *   await settled();
 *
 *   assert.strictEqual(serverRequests, 2, 'called again');
 *
 *   await settled();
 * });
 * ```
 *
 * @method pollTask
 * @param { Destroyable } destroyable the entangled object that was provided with the original *Task call
 * @param { TaskOrName } taskOrName a function representing the task, or string
 *                                  specifying a property representing the task,
 *                                  which is run at the provided time specified
 *                                  by timeout
 * @param { Token } token the Token for the pollTask, either a string or number
 * @public
 */
declare function pollTask(destroyable: Destroyable, taskOrName: TaskOrName, token?: Token): Token;
/**
 * Clears a previously setup polling task.
 *
 * NOTE: This does not cancel any nested `runTask` calls. You're required to cancel any
 * cancelable behaviors, including any calls to `runTask` using `cancelTask`.
 *
 * Example:
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { inject as service } from '@ember/service';
 * import { pollTask, runTask } from 'ember-lifeline';
 *
 * export default AutoRefreshComponent extends Component {
 *   @service api;
 *
 *   enableAutoRefresh() {
 *     this._pollToken = pollTask(this, (next) => {
 *       this.get('api').request('get', 'some/path')
 *         .then(() => {
 *           runTask(this, next, 1800);
 *         })
 *     });
 *   },
 *
 *   disableAutoRefresh() {
 *     cancelPoll(this, this._pollToken);
 *   },
 * }
 * ```
 *
 * @method cancelPoll
 * @param { Destroyable } destroyable the entangled object that was provided with the original *Task call
 * @param { Token } token the Token for the pollTask to be cleared, either a string or number
 * @public
 */
declare function cancelPoll(destroyable: Destroyable, token: Token): void | undefined;
export { _setRegisteredPollers, setShouldPoll, getQueuedPollTasks, pollTask, cancelPoll };
