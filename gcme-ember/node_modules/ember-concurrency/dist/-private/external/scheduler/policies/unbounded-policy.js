import { STARTED } from './execution-states.js';

class UnboundedReducer {
  step() {
    return STARTED;
  }
}
const SINGLETON_REDUCER = new UnboundedReducer();
class UnboundedPolicy {
  makeReducer() {
    return SINGLETON_REDUCER;
  }
}

export { UnboundedPolicy as default };
//# sourceMappingURL=unbounded-policy.js.map
