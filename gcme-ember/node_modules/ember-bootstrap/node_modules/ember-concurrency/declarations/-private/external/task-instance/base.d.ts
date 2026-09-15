export class BaseTaskInstance {
    constructor({ task, args, executor, performType, hasEnabledEvents }: {
        task: any;
        args: any;
        executor: any;
        performType: any;
        hasEnabledEvents: any;
    });
    task: any;
    args: any;
    performType: any;
    executor: any;
    hasEnabledEvents: any;
    setState(): void;
    onStarted(): void;
    onSuccess(): void;
    onError(): void;
    onCancel(): void;
    formatCancelReason(): void;
    selfCancelLoopWarning(): void;
    onFinalize(callback: any): void;
    proceed(index: any, yieldResumeType: any, value: any): void;
    cancel(cancelReason?: string): void;
    then(...args: any[]): any;
    catch(...args: any[]): any;
    finally(...args: any[]): any;
    toString(): string;
    start(): this;
    __ec_yieldable__(parentTaskInstance: any, resumeIndex: any): any;
}
//# sourceMappingURL=base.d.ts.map