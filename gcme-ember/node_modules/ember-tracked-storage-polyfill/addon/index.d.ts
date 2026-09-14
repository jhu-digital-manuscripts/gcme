declare const STORAGE: unique symbol;
export interface TrackedStorage<T> {
    [STORAGE]: T;
}
export declare function createStorage<T = unknown>(initialValue: T, isEqual?: (a: T, b: T) => boolean): TrackedStorage<T>;
export declare function getValue<T>(storage: TrackedStorage<T>): T;
declare type TrackedStorageValue<T extends TrackedStorage<unknown>> = T extends TrackedStorage<infer U> ? U : never;
export declare function setValue<T extends TrackedStorage<unknown>>(storage: T, value: TrackedStorageValue<T>): void;
export {};
