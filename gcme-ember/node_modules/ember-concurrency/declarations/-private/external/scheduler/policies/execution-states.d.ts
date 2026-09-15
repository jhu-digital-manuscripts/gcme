export const TYPE_CANCELLED: "CANCELLED";
export const TYPE_STARTED: "STARTED";
export const TYPE_QUEUED: "QUEUED";
export namespace STARTED {
    export { TYPE_STARTED as type };
}
export namespace QUEUED {
    export { TYPE_QUEUED as type };
}
export function makeCancelState(reason: any): {
    type: string;
    reason: any;
};
//# sourceMappingURL=execution-states.d.ts.map