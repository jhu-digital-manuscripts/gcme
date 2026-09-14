export default EnqueuedPolicy;
declare class EnqueuedPolicy extends BoundedPolicy {
    makeReducer(): EnqueuedReducer;
}
import BoundedPolicy from './bounded-policy';
declare class EnqueuedReducer {
    constructor(remainingSlots: any);
    remainingSlots: any;
    step(): {
        type: string;
    };
}
//# sourceMappingURL=enqueued-policy.d.ts.map