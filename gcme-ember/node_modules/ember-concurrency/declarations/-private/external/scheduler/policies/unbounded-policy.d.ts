export default UnboundedPolicy;
declare class UnboundedPolicy {
    makeReducer(): UnboundedReducer;
}
declare class UnboundedReducer {
    step(): {
        type: string;
    };
}
//# sourceMappingURL=unbounded-policy.d.ts.map