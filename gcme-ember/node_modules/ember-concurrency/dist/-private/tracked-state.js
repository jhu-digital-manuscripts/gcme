import { tracked } from '@glimmer/tracking';
import { DEFAULT_STATE } from './external/task/default-state.js';
import { INITIAL_STATE } from './external/task-instance/initial-state.js';

function trackMixin(proto, obj, key) {
  const propDesc = Object.getOwnPropertyDescriptor(proto, key);
  propDesc.initializer = propDesc.initializer || (() => proto[key]);
  delete propDesc.value;
  const desc = tracked(obj, key, propDesc);
  obj[key] = desc;
  return obj;
}
function applyTracked(proto, initial) {
  return Object.keys(proto).reduce((acc, key) => {
    return trackMixin(proto, acc, key);
  }, initial);
}
let TRACKED_INITIAL_TASK_STATE;
let TRACKED_INITIAL_INSTANCE_STATE;
TRACKED_INITIAL_TASK_STATE = applyTracked(DEFAULT_STATE, {});
TRACKED_INITIAL_TASK_STATE = applyTracked({
  numRunning: 0,
  numQueued: 0,
  isRunning: false,
  isQueued: false,
  isIdle: true,
  state: 'idle'
}, TRACKED_INITIAL_TASK_STATE);
TRACKED_INITIAL_INSTANCE_STATE = applyTracked(INITIAL_STATE, {});
TRACKED_INITIAL_INSTANCE_STATE = applyTracked({
  state: 'waiting',
  isDropped: false,
  isRunning: false
}, TRACKED_INITIAL_INSTANCE_STATE);
Object.freeze(TRACKED_INITIAL_TASK_STATE);
Object.freeze(TRACKED_INITIAL_INSTANCE_STATE);

export { TRACKED_INITIAL_INSTANCE_STATE, TRACKED_INITIAL_TASK_STATE };
//# sourceMappingURL=tracked-state.js.map
