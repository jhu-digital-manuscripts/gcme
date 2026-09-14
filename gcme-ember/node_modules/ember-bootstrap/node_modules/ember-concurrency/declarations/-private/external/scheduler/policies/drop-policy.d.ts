export default DropPolicy;
declare class DropPolicy extends BoundedPolicy {
    makeReducer(): DropReducer;
}
import BoundedPolicy from './bounded-policy';
declare class DropReducer {
    constructor(remainingSlots: any);
    remainingSlots: any;
    step(): {
        type: string;
    };
}
//# sourceMappingURL=drop-policy.d.ts.map