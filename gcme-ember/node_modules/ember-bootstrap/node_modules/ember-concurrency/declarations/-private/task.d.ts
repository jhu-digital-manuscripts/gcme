/**
  The `Task` object lives on a host Ember object (e.g.
  a Component, Route, or Controller). You call the
  {@linkcode Task#perform .perform()} method on this object
  to create run individual {@linkcode TaskInstance}s,
  and at any point, you can call the {@linkcode Task#cancelAll .cancelAll()}
  method on this object to cancel all running or enqueued
  {@linkcode TaskInstance}s.

  <style>
    .ignore-this--this-is-here-to-hide-constructor,
    #Task { display: none }
  </style>

  @class Task
*/
export class Task extends BaseTask {
    _taskInstanceFactory(args: any, performType: any, linkedObject: any): TaskInstance;
    _clone(): Task;
}
export class EncapsulatedTask extends Task {
    taskObj: any;
    _encapsulatedTaskStates: WeakMap<object, any>;
    _encapsulatedTaskInstanceProxies: WeakMap<object, any>;
    _getEncapsulatedTaskClass(): any;
    _taskInstanceFactory(args: any, performType: any): any;
    _wrappedEncapsulatedTaskInstance(taskInstance: any): any;
}
import { Task as BaseTask } from './external/task/task';
import { TaskInstance } from './task-instance';
//# sourceMappingURL=task.d.ts.map