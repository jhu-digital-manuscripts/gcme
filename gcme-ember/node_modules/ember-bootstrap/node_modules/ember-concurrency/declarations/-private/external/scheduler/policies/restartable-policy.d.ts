export default RestartablePolicy;
declare class RestartablePolicy extends BoundedPolicy {
    makeReducer(numRunning: any, numQueued: any): RestartableReducer;
}
import BoundedPolicy from './bounded-policy';
declare class RestartableReducer {
    constructor(numToCancel: any);
    numToCancel: any;
    step(): {
        type: string;
    };
}
//# sourceMappingURL=restartable-policy.d.ts.map