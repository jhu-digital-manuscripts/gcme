export default Scheduler;
declare class Scheduler {
    constructor(schedulerPolicy: any, stateTrackingEnabled: any);
    schedulerPolicy: any;
    stateTrackingEnabled: any;
    taskInstances: any[];
    cancelAll(guid: any, cancelRequest: any): Promise<void[]>;
    perform(taskInstance: any): void;
    scheduleRefresh(): void;
    refresh(): void;
}
//# sourceMappingURL=scheduler.d.ts.map