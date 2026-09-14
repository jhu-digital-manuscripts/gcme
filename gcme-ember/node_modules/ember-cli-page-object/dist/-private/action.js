import { getter } from '../macros/getter.js';
import { throwContextualError } from './better-errors.js';
import '@ro0gr/ceibo';
import { run } from './run.js';
import './helpers.js';
import 'rsvp';
import './chainable.js';

function action(options, act) {
  [act, options] = normalizeArgs(options, act);
  if (typeof act !== 'function') {
    throw new Error('`action()` expects a function argument.');
  }
  return getter(function (key) {
    return function (...args) {
      options.pageObjectKey = formatKey(key, args);
      return run(this, () => {
        try {
          const invocation = act.bind(this)(...args);
          return Promise.resolve(invocation).catch(e => {
            throwContextualError(this, options, e);
          });
        } catch (e) {
          throwContextualError(this, options, e);
        }
      });
    };
  });
}
function normalizeArgs(options, act) {
  if (!act) {
    return [options, {}];
  }
  return [act, {
    ...options
  }];
}
function formatKey(key, args) {
  return `${key}(${args.length ? `"${args.map(a => String(a)).join('", "')}"` : ``})`;
}

export { action as default };
