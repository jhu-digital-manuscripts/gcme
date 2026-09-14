/**
  A `TaskInstance` represent a single execution of a
  {@linkcode Task}. Every call to {@linkcode Task#perform} returns
  a `TaskInstance`.

  `TaskInstance`s are cancelable, either explicitly
  via {@linkcode TaskInstance#cancel} or {@linkcode Task#cancelAll},
  or automatically due to the host object being destroyed, or
  because concurrency policy enforced by a
  {@linkcode TaskProperty Task Modifier} canceled the task instance.

  <style>
    .ignore-this--this-is-here-to-hide-constructor,
    #TaskInstance { display: none }
  </style>

  @class TaskInstance
*/
export class TaskInstance extends BaseTaskInstance {
    setState(props: any): void;
    _recomputeState(props: any): "waiting" | "canceled" | "finished" | "running" | "dropped";
    onError(error: any): void;
    onCancel(cancelReason: any): void;
    formatCancelReason(reason: any): string;
    getName(): any;
    name: any;
    selfCancelLoopWarning(parent: any): void;
    triggerEvent(...allArgs: any[]): void;
}
import { BaseTaskInstance } from './external/task-instance/base';
//# sourceMappingURL=task-instance.d.ts.map