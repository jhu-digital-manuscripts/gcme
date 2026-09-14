export default KeepLatestPolicy;
declare class KeepLatestPolicy extends BoundedPolicy {
    makeReducer(numRunning: any, numQueued: any): KeepLatestReducer;
}
import BoundedPolicy from './bounded-policy';
declare class KeepLatestReducer {
    constructor(remainingSlots: any, numToCancel: any);
    remainingSlots: any;
    numToCancel: any;
    step(): {
        type: string;
    };
}
//# sourceMappingURL=keep-latest-policy.d.ts.map