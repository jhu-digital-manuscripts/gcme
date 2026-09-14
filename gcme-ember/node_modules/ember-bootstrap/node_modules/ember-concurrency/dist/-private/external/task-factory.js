import Scheduler from './scheduler/scheduler.js';
import UnboundedPolicy from './scheduler/policies/unbounded-policy.js';
import EnqueuedPolicy from './scheduler/policies/enqueued-policy.js';
import DropPolicy from './scheduler/policies/drop-policy.js';
import KeepLatestPolicy from './scheduler/policies/keep-latest-policy.js';
import RestartablePolicy from './scheduler/policies/restartable-policy.js';
import { Task as Task$1 } from './task/task.js';
import { TaskGroup as TaskGroup$1 } from './task/task-group.js';
import { DEFAULT_ENVIRONMENT } from './environment.js';

function assertModifiersNotMixedWithGroup(obj) {
  if (obj._hasSetConcurrencyConstraint && obj._taskGroupPath) {
    throw new Error(`Cannot use both 'group' and other concurrency-constraining task modifiers (e.g. 'drop', 'enqueue', 'restartable')`);
  }
}
function assertUnsetBufferPolicy(obj) {
  if (obj._hasSetBufferPolicy) {
    throw new Error(`Cannot set multiple buffer policies on a task or task group. ${obj._schedulerPolicyClass} has already been set for task or task group '${obj.name}'`);
  }
}
const MODIFIER_REGISTRY = {
  enqueue: (factory, value) => value && factory.setBufferPolicy(EnqueuedPolicy),
  evented: (factory, value) => value && factory.setEvented(value),
  debug: (factory, value) => value && factory.setDebug(value),
  drop: (factory, value) => value && factory.setBufferPolicy(DropPolicy),
  group: (factory, groupName) => factory.setGroup(groupName),
  keepLatest: (factory, value) => value && factory.setBufferPolicy(KeepLatestPolicy),
  maxConcurrency: (factory, maxConcurrency) => factory.setMaxConcurrency(maxConcurrency),
  onState: (factory, onStateCallback) => factory.setOnState(onStateCallback),
  restartable: (factory, value) => value && factory.setBufferPolicy(RestartablePolicy)
};

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
function registerModifier(name, callback) {
  if (MODIFIER_REGISTRY[name]) {
    throw new Error(`A modifier with the name '${name}' has already been defined.`);
  }
  MODIFIER_REGISTRY[name] = callback;
}

/**
 * Returns a specified modifier, if it exists in the registry
 *
 * @param {string} name Name of the modifier
 * @returns {TaskFactory~TaskModifier?}
 */
function getModifier(name) {
  return MODIFIER_REGISTRY[name];
}

/**
 * Returns whether a specified modifier exists in the registry
 *
 * @param {string} name Name of the modifier
 * @returns {boolean}
 */
function hasModifier(name) {
  return name in MODIFIER_REGISTRY;
}

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
let TaskFactory$1 = class TaskFactory {
  env = DEFAULT_ENVIRONMENT;
  _debug = null;
  _enabledModifiers = [];
  _hasSetConcurrencyConstraint = false;
  _hasSetBufferPolicy = false;
  _hasEnabledEvents = false;
  _maxConcurrency = null;
  _onStateCallback = (state, taskable) => taskable.setState(state);
  _schedulerPolicyClass = UnboundedPolicy;
  _taskGroupPath = null;
  constructor(name = '<unknown>', taskDefinition = null, options = {}) {
    this.name = name;
    this.taskDefinition = taskDefinition;
    this.options = options;
    this._processModifierOptions(options);
  }

  /**
   * Returns a new Task bound to the given context
   *
   * @protected
   * @param {*} context
   * @returns {Task}
   */
  createTask(context) {
    let options = this.getTaskOptions(context);
    return new Task$1(Object.assign({
      generatorFactory: args => this.taskDefinition.apply(context, args)
    }, options));
  }

  /**
   * Returns a new TaskGroup bound to the given context
   *
   * @protected
   * @param {*} context
   * @returns {Task}
   */
  createTaskGroup(context) {
    let options = this.getTaskOptions(context);
    return new TaskGroup$1(options);
  }

  /**
   * Returns a modifier callback with the given name bound to this TaskFactory,
   * if registered.
   *
   * @protected
   * @param {string} name
   * @returns {TaskFactory~TaskModifier?}
   */
  getModifier(name) {
    if (hasModifier(name)) {
      return MODIFIER_REGISTRY[name].bind(null, this);
    }
  }

  /**
   * Returns the options provided to TaskFactory
   *
   * @public
   * @returns {object}
   */
  getOptions() {
    return this.options;
  }

  /**
   * Returns a new Scheduler instance
   *
   * @protected
   * @param {*} schedulerPolicy
   * @param {boolean} stateTrackingEnabled
   * @returns {Scheduler}
   */
  getScheduler(schedulerPolicy, stateTrackingEnabled) {
    return new Scheduler(schedulerPolicy, stateTrackingEnabled);
  }

  /**
   * Returns the options to pass to a Task or TaskGroup constructor
   *
   * @protected
   * @param {*} context
   * @returns {object}
   */
  getTaskOptions(context) {
    let group, scheduler;
    let onStateCallback = this._onStateCallback;
    if (this._taskGroupPath) {
      group = context[this._taskGroupPath];
      if (!(group instanceof TaskGroup$1)) {
        throw new Error(`Expected group '${this._taskGroupPath}' to be defined but was not found.`);
      }
      scheduler = group.scheduler;
    } else {
      let schedulerPolicy = new this._schedulerPolicyClass(this._maxConcurrency);
      scheduler = this.getScheduler(schedulerPolicy, onStateCallback && typeof onStateCallback === 'function');
    }
    return {
      context,
      debug: this._debug,
      env: this.env,
      name: this.name,
      group,
      scheduler,
      hasEnabledEvents: this._hasEnabledEvents,
      onStateCallback,
      enabledModifiers: this._enabledModifiers,
      modifierOptions: this.getOptions()
    };
  }

  /**
   * Sets the Scheduler buffer policy class to the specified value.
   *
   * Will raise an assertion if a buffer policy has already been specified
   *
   * @param {*} policy
   * @returns {TaskFactory}
   */
  setBufferPolicy(policy) {
    assertUnsetBufferPolicy(this);
    this._hasSetBufferPolicy = true;
    this._hasSetConcurrencyConstraint = true;
    this._schedulerPolicyClass = policy;
    assertModifiersNotMixedWithGroup(this);
    return this;
  }

  /**
   * Sets debug mode
   *
   * @param {boolean} enabled
   * @returns {TaskFactory}
   */
  setDebug(enabled) {
    this._debug = enabled;
    return this;
  }

  /**
   * Sets whether Task will dispatch Task events or not
   *
   * @param {boolean} enabled
   * @returns {TaskFactory}
   */
  setEvented(enabled) {
    this._hasEnabledEvents = enabled;
    return this;
  }

  /**
   * Sets Scheduling policy's `maxConcurrency`
   *
   * @param {number} maxConcurrency
   * @returns {TaskFactory}
   */
  setMaxConcurrency(maxConcurrency) {
    this._hasSetConcurrencyConstraint = true;
    this._maxConcurrency = maxConcurrency;
    return this;
  }

  /**
   * Assigns Task created from this factory to the specified group name
   *
   * @param {string} group
   * @returns {TaskFactory}
   */
  setGroup(group) {
    this._taskGroupPath = group;
    return this;
  }

  /**
   * Sets the name of tasks created from this factory
   *
   * @param {string} name
   * @returns {TaskFactory}
   */
  setName(name) {
    this.name = name;
    return this;
  }

  /**
   * Sets the callback used on state updates. Can be set to null to disable
   * state tracking on tasks.
   *
   * @param {function} onStateCallback
   * @returns {TaskFactory}
   */
  setOnState(onStateCallback) {
    this._onStateCallback = onStateCallback;
    return this;
  }

  /**
   * Sets the definition for tasks created from this factory
   *
   * @param {*} taskDefinition
   * @returns {TaskFactory}
   */
  setTaskDefinition(taskDefinition) {
    this.taskDefinition = taskDefinition;
    return this;
  }
  _processModifierOptions(options) {
    if (!options) {
      return;
    }
    for (let key of Object.keys(options)) {
      let value = options[key];
      let modifier = this.getModifier(key);
      if (typeof modifier === 'function' && modifier(value)) {
        this._enabledModifiers.push(key);
      }
    }
  }
};

export { TaskFactory$1 as TaskFactory, getModifier, hasModifier, registerModifier };
//# sourceMappingURL=task-factory.js.map
