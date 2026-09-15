import Ember from 'ember';
import getTask from './utils/get-task.js';
import { registerDestructor } from '@ember/destroyable';

function indexable(input) {
  return input;
}
/**
 * A map of instances/poller functions that allows us to
 * store poller tokens per instance.
 *
 * @private
 *
 */


let registeredPollers = new WeakMap();
/**
 * Test use only. Allows for swapping out the WeakMap to a Map, giving
 * us the ability to detect whether the pollers set is empty.
 *
 * @private
 * @param {*} mapForTesting A map used to ensure correctness when testing.
 */

function _setRegisteredPollers(mapForTesting) {
  registeredPollers = mapForTesting;
}
let token = 0;

let _shouldPollOverride;

function shouldPoll() {
  if (_shouldPollOverride) {
    return _shouldPollOverride();
  }

  return !Ember.testing;
}
/**
 * Allows for overriding of the polling behavior to explicitly control
 * whether polling should occur or not.
 *
 * @param { Function } callback
 * @public
 */


function setShouldPoll(callback) {
  _shouldPollOverride = callback;
}
function getQueuedPollTasks() {
  let symbol = Symbol.for('LIFELINE_QUEUED_POLL_TASKS');
  let globalObj = getGlobal();
  let queuedPollTasks = globalObj[symbol];

  if (!queuedPollTasks) {
    queuedPollTasks = globalObj[symbol] = new Map();
  }

  return queuedPollTasks;
}
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

function pollTask(destroyable, taskOrName, token = getNextToken()) {
  let next;
  let task = getTask(destroyable, taskOrName, 'pollTask');

  let tick = () => task.call(destroyable, next);

  let pollers = registeredPollers.get(destroyable);

  if (!pollers) {
    pollers = new Set();
    registeredPollers.set(destroyable, pollers);
    registerDestructor(destroyable, getPollersDisposable(destroyable, pollers));
  }

  pollers.add(token);

  if (shouldPoll()) {
    next = tick;
  } else {
    next = () => {
      getQueuedPollTasks().set(token, tick);
    };
  }

  task.call(destroyable, next);
  return token;
}
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

function cancelPoll(destroyable, token) {
  let pollToken;
  let pollers = registeredPollers.get(destroyable);
  pollToken = token;

  if (pollers !== undefined) {
    pollers.delete(pollToken);
  }

  getQueuedPollTasks().delete(pollToken);
}

function getGlobal() {
  // eslint-disable-next-line n/no-unsupported-features/es-builtins
  if (typeof globalThis !== 'undefined') return indexable(globalThis);
  if (typeof self !== 'undefined') return indexable(self);
  if (typeof window !== 'undefined') return indexable(window);
  if (typeof global !== 'undefined') return indexable(global);
  throw new Error('unable to locate global object');
}

function getPollersDisposable(destroyable, pollers) {
  return function () {
    pollers.forEach(token => {
      cancelPoll(destroyable, token);
    });
  };
}

function getNextToken() {
  return token++;
}

export { _setRegisteredPollers, cancelPoll, getQueuedPollTasks, pollTask, setShouldPoll };
