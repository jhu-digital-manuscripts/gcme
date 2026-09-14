/**
 * "Task Groups" provide a means for applying
 * task modifiers to groups of tasks. Once a {@linkcode Task} is declared
 * as part of a group task, modifiers like `drop` or `restartable`
 * will no longer affect the individual `Task`. Instead those
 * modifiers can be applied to the entire group.
 *
 * Turns the decorated property into a task group.
 *
 * Optionally takes a hash of options that will be applied as modifiers to the
 * task group. For instance `maxConcurrency` or `keepLatest`.
 *
 * ```js
 * import Component from '@glimmer/component';
 * import { task, taskGroup } from 'ember-concurrency';
 *
 * class MyComponent extends Component {
 *   &#64;taskGroup({ maxConcurrency: 5 }) chores;
 *
 *   &#64;task({ group: 'chores' })
 *   *mowLawn() {}
 *
 *   &#64;task({ group: 'chores' })
 *   *doDishes() {}
 * }
 * ```
 *
 * <style>
 *  .ignore-this--this-is-here-to-hide-constructor,
 *  #TaskGroup { display: none }
 * </style>
 *
 * @class TaskGroup
 */
export class TaskGroup extends TaskGroupBase {
}
import { TaskGroup as TaskGroupBase } from './external/task/task-group';
//# sourceMappingURL=task-group.d.ts.map