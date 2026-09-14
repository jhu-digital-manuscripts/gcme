import Scheduler from '../external/scheduler/scheduler.js';
import { once } from '@ember/runloop';

class EmberScheduler extends Scheduler {
  scheduleRefresh() {
    once(this, this.refresh);
  }
}

export { EmberScheduler as default };
//# sourceMappingURL=ember-scheduler.js.map
