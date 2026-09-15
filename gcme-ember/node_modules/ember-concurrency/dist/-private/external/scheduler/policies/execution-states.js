const TYPE_CANCELLED = 'CANCELLED';
const TYPE_STARTED = 'STARTED';
const TYPE_QUEUED = 'QUEUED';
const STARTED = {
  type: TYPE_STARTED
};
const QUEUED = {
  type: TYPE_QUEUED
};
const makeCancelState = reason => ({
  type: TYPE_CANCELLED,
  reason
});

export { QUEUED, STARTED, TYPE_CANCELLED, TYPE_QUEUED, TYPE_STARTED, makeCancelState };
//# sourceMappingURL=execution-states.js.map
