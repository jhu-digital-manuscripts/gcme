import { join } from '@ember/runloop';
import { assert } from '@ember/debug';
import { settled } from '@ember/test-helpers';
import { getQueuedPollTasks } from '../poll-task.js';
import 'ember';
import '../utils/get-task.js';
import '@ember/destroyable';

function pollTaskFor(token) {
  let tick = getQueuedPollTasks().get(token);
  assert(`You cannot advance pollTask '${token}' when \`next\` has not been called.`, !!tick);
  join(null, tick);
  return settled();
}

export { pollTaskFor as default };
