import { helper } from '@ember/component/helper';

function taskHelper(positional) {
  let [task, ...args] = positional;

  // @ts-expect-errors _curry isn't typed yet
  return task._curry(...args);
}
var task = helper(taskHelper);

export { task as default };
//# sourceMappingURL=task.js.map
