import NullState from './null-state.js';

const NULL_STATE = new NullState();
class NullStateTracker {
  stateFor() {
    return NULL_STATE;
  }
  computeFinalStates() {}
}

export { NullStateTracker as default };
//# sourceMappingURL=null-state-tracker.js.map
