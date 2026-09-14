export default RefreshState;
declare class RefreshState {
    constructor(taskable: any, tag: any);
    taskable: any;
    group: any;
    numRunning: number;
    numQueued: number;
    numPerformedInc: number;
    attrs: {};
    tag: any;
    onCompletion(taskInstance: any): void;
    onPerformed(taskInstance: any): void;
    onStart(taskInstance: any): void;
    onRunning(taskInstance: any): void;
    onQueued(): void;
    recurseTaskGroups(callback: any): void;
    applyStateFrom(other: any): void;
}
//# sourceMappingURL=state.d.ts.map