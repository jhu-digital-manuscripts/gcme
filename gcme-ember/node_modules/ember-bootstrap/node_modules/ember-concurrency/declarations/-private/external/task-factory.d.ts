/**
 * Callback type defining a task modifier
 *
 * @callback TaskFactory~TaskModifier
 * @param {TaskFactory} factory
 * @param {*} taskModifierOption
 */
/**
 * Registers a new modifier with the modifier registry
 *
 * @param {string} name Name of the modifier
 * @param {TaskFactory~TaskModifier} callback
 */
export function registerModifier(name: string, callback: any): void;
/**
 * Returns a specified modifier, if it exists in the registry
 *
 * @param {string} name Name of the modifier
 * @returns {TaskFactory~TaskModifier?}
 */
export function getModifier(name: string): TaskFactory;
/**
 * Returns whether a specified modifier exists in the registry
 *
 * @param {string} name Name of the modifier
 * @returns {boolean}
 */
export function hasModifier(name: string): boolean;
/**
 * Factory used for instantiating Tasks and Task Groups. Mostly for internal
 * use, but some public APIs exposed via the Task Modifier APIs.
 *
 * <style>
 *  .ignore-this--this-is-here-to-hide-constructor,
 *  #TaskFactory { display: none }
 * </style>
 *
 * @class TaskFactory
 */
export class TaskFactory {
    constructor(name?: string, taskDefinition?: null, options?: {});
    env: import("./environment").Environment;
    _debug: null;
    _enabledModifiers: any[];
    _hasSetConcurrencyConstraint: boolean;
    _hasSetBufferPolicy: boolean;
    _hasEnabledEvents: boolean;
    _maxConcurrency: null;
    _onStateCallback: (state: any, taskable: any) => any;
    _schedulerPolicyClass: typeof UnboundedSchedulerPolicy;
    _taskGroupPath: null;
    name: string;
    taskDefinition: any;
    options: {};
    /**
     * Returns a new Task bound to the given context
     *
     * @protected
     * @param {*} context
     * @returns {Task}
     */
    protected createTask(context: any): Task;
    /**
     * Returns a new TaskGroup bound to the given context
     *
     * @protected
     * @param {*} context
     * @returns {Task}
     */
    protected createTaskGroup(context: any): Task;
    /**
     * Returns a modifier callback with the given name bound to this TaskFactory,
     * if registered.
     *
     * @protected
     * @param {string} name
     * @returns {TaskFactory~TaskModifier?}
     */
    protected getModifier(name: string): TaskFactory;
    /**
     * Returns the options provided to TaskFactory
     *
     * @public
     * @returns {object}
     */
    public getOptions(): object;
    /**
     * Returns a new Scheduler instance
     *
     * @protected
     * @param {*} schedulerPolicy
     * @param {boolean} stateTrackingEnabled
     * @returns {Scheduler}
     */
    protected getScheduler(schedulerPolicy: any, stateTrackingEnabled: boolean): Scheduler;
    /**
     * Returns the options to pass to a Task or TaskGroup constructor
     *
     * @protected
     * @param {*} context
     * @returns {object}
     */
    protected getTaskOptions(context: any): object;
    /**
     * Sets the Scheduler buffer policy class to the specified value.
     *
     * Will raise an assertion if a buffer policy has already been specified
     *
     * @param {*} policy
     * @returns {TaskFactory}
     */
    setBufferPolicy(policy: any): TaskFactory;
    /**
     * Sets debug mode
     *
     * @param {boolean} enabled
     * @returns {TaskFactory}
     */
    setDebug(enabled: boolean): TaskFactory;
    /**
     * Sets whether Task will dispatch Task events or not
     *
     * @param {boolean} enabled
     * @returns {TaskFactory}
     */
    setEvented(enabled: boolean): TaskFactory;
    /**
     * Sets Scheduling policy's `maxConcurrency`
     *
     * @param {number} maxConcurrency
     * @returns {TaskFactory}
     */
    setMaxConcurrency(maxConcurrency: number): TaskFactory;
    /**
     * Assigns Task created from this factory to the specified group name
     *
     * @param {string} group
     * @returns {TaskFactory}
     */
    setGroup(group: string): TaskFactory;
    /**
     * Sets the name of tasks created from this factory
     *
     * @param {string} name
     * @returns {TaskFactory}
     */
    setName(name: string): TaskFactory;
    /**
     * Sets the callback used on state updates. Can be set to null to disable
     * state tracking on tasks.
     *
     * @param {function} onStateCallback
     * @returns {TaskFactory}
     */
    setOnState(onStateCallback: Function): TaskFactory;
    /**
     * Sets the definition for tasks created from this factory
     *
     * @param {*} taskDefinition
     * @returns {TaskFactory}
     */
    setTaskDefinition(taskDefinition: any): TaskFactory;
    _processModifierOptions(options: any): void;
}
import UnboundedSchedulerPolicy from './scheduler/policies/unbounded-policy';
import { Task } from './task/task';
import Scheduler from './scheduler/scheduler';
//# sourceMappingURL=task-factory.d.ts.map