import { TaskFactory } from './task-factory.js';

/**
 * This builder function is called by the transpiled code from
 * `task(async () => {})`. See async-arrow-task-transform.js
 *
 * @private
 */
function buildTask(contextFn, options, taskName, bufferPolicyName) {
  let optionsWithBufferPolicy = options;
  if (bufferPolicyName) {
    optionsWithBufferPolicy = Object.assign({}, optionsWithBufferPolicy);
    optionsWithBufferPolicy[bufferPolicyName] = true;
  }
  const result = contextFn();
  const taskFactory = new TaskFactory(taskName || '<unknown>', result.generator, optionsWithBufferPolicy);
  return taskFactory.createTask(result.context);
}

export { buildTask };
//# sourceMappingURL=async-arrow-runtime.js.map
