export class Environment {
    assert(): void;
    async(callback: any): void;
    reportUncaughtRejection(): void;
    defer(): {
        promise: null;
        resolve: null;
        reject: null;
    };
    globalDebuggingEnabled(): boolean;
}
export const DEFAULT_ENVIRONMENT: Environment;
//# sourceMappingURL=environment.d.ts.map