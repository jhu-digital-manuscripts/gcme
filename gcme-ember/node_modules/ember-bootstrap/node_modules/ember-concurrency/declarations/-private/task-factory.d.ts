export class TaskFactory extends BaseTaskFactory {
    env: import("./ember-environment").EmberEnvironment;
    createTask(context: any): Task | EncapsulatedTask;
    createTaskGroup(context: any): TaskGroup;
    addCancelEvents(...cancelEventNames: any[]): this;
    _cancelEventNames: any;
    addObserverKeys(...keys: any[]): this;
    _observes: any;
    addPerformEvents(...eventNames: any[]): this;
    _eventNames: any;
    getModifier(name: any): BaseTaskFactory;
    getScheduler(schedulerPolicy: any, stateTrackingEnabled: any): EmberScheduler;
    _setupEmberKVO(proto: any): void;
    set taskFn(fn: any);
    get taskFn(): any;
}
import { TaskFactory as BaseTaskFactory } from './external/task-factory';
import { Task } from './task';
import { EncapsulatedTask } from './task';
import { TaskGroup } from './task-group';
import EmberScheduler from './scheduler/ember-scheduler';
//# sourceMappingURL=task-factory.d.ts.map