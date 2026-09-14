export default Refresh;
declare class Refresh {
    constructor(schedulerPolicy: any, stateTracker: any, taskInstances: any);
    stateTracker: any;
    schedulerPolicy: any;
    initialTaskInstances: any;
    startingInstances: any[];
    process(): any;
    filterFinishedTaskInstances(): any[];
    setTaskInstanceExecutionState(taskInstance: any, desiredState: any): boolean | undefined;
    applyState(state: any): void;
}
//# sourceMappingURL=refresh.d.ts.map