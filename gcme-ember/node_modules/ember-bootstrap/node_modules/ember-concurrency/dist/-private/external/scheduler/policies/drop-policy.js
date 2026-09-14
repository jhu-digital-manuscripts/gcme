import BoundedPolicy from './bounded-policy.js';
import { STARTED, makeCancelState } from './execution-states.js';

const CANCELLED = makeCancelState(`it belongs to a 'drop' Task that was already running`);
class DropReducer {
  constructor(remainingSlots) {
    this.remainingSlots = remainingSlots;
  }
  step() {
    if (this.remainingSlots > 0) {
      this.remainingSlots--;
      return STARTED;
    }
    return CANCELLED;
  }
}
class DropPolicy extends BoundedPolicy {
  makeReducer() {
    return new DropReducer(this.maxConcurrency);
  }
}

export { DropPolicy as default };
//# sourceMappingURL=drop-policy.js.map
