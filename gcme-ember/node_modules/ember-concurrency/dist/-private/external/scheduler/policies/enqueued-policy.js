import BoundedPolicy from './bounded-policy.js';
import { STARTED, QUEUED } from './execution-states.js';

class EnqueuedReducer {
  constructor(remainingSlots) {
    this.remainingSlots = remainingSlots;
  }
  step() {
    if (this.remainingSlots > 0) {
      this.remainingSlots--;
      return STARTED;
    } else {
      return QUEUED;
    }
  }
}
class EnqueuedPolicy extends BoundedPolicy {
  makeReducer() {
    return new EnqueuedReducer(this.maxConcurrency);
  }
}

export { EnqueuedPolicy as default };
//# sourceMappingURL=enqueued-policy.js.map
