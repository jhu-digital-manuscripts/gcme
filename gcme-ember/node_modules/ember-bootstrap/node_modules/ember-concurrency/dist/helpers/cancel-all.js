import { helper } from '@ember/component/helper';
import { assert } from '@ember/debug';
import { taskHelperClosure } from '../-private/helpers.js';

const CANCEL_REASON = "the 'cancel-all' template helper was invoked";
function cancelHelper(args) {
  let cancelable = args[0];
  if (!cancelable || typeof cancelable.cancelAll !== 'function') {
    assert(`The first argument passed to the \`cancel-all\` helper should be a Task or TaskGroup (without quotes); you passed ${cancelable}`, false);
  }
  return taskHelperClosure('cancel-all', 'cancelAll', [cancelable, {
    reason: CANCEL_REASON
  }]);
}
var cancelAll = helper(cancelHelper);

export { cancelHelper, cancelAll as default };
//# sourceMappingURL=cancel-all.js.map
