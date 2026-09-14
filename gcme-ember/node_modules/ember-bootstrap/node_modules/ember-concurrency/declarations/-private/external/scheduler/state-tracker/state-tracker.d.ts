export default StateTracker;
declare class StateTracker {
    states: Map<any, any>;
    stateFor(taskable: any): any;
    computeFinalStates(callback: any): void;
    computeRecursiveState(): void;
    forEachState(callback: any): void;
}
//# sourceMappingURL=state-tracker.d.ts.map