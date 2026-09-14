export class Task extends Taskable {
    generatorFactory: any;
    perform: (...args: any[]) => any;
    linked(): TaskLinkProxy;
    unlinked(): TaskLinkProxy;
    _clone(): Task;
    _curry(...args: any[]): Task;
    _perform(...args: any[]): any;
    _performShared(args: any, performType: any, linkedObject: any): any;
    _taskInstanceOptions(args: any, performType: any, _linkedObject: any): {
        task: this;
        args: any;
        executor: TaskInstanceExecutor;
        performType: any;
        hasEnabledEvents: any;
    };
}
import { Taskable } from './taskable';
declare class TaskLinkProxy {
    constructor(task: any, performType: any, linkedObject: any);
    task: any;
    performType: any;
    linkedObject: any;
    perform(...args: any[]): any;
}
import { TaskInstanceExecutor } from '../task-instance/executor';
export {};
//# sourceMappingURL=task.d.ts.map