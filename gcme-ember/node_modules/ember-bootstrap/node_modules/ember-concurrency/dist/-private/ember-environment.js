import Ember from 'ember';
import { defer } from 'rsvp';
import { Environment } from './external/environment.js';
import { assert } from '@ember/debug';
import { join, schedule, next } from '@ember/runloop';

class EmberEnvironment extends Environment {
  assert(...args) {
    assert(...args);
  }
  async(callback) {
    join(() => schedule('actions', callback));
  }
  reportUncaughtRejection(error) {
    next(null, function () {
      if (Ember.onerror) {
        Ember.onerror(error);
      } else {
        throw error;
      }
    });
  }
  defer() {
    return defer();
  }
  globalDebuggingEnabled() {
    return Ember.ENV.DEBUG_TASKS;
  }
}
const EMBER_ENVIRONMENT = new EmberEnvironment();

export { EMBER_ENVIRONMENT, EmberEnvironment };
//# sourceMappingURL=ember-environment.js.map
