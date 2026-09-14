export type Awaited<T> = T extends PromiseLike<infer TResult> ? TResult : T;
export type Omit<Obj, Keys> = Pick<Obj, Exclude<keyof Obj, Keys>>;
export type Values<T> = T[keyof T];
export type PropertiesAssignableToType<T, U> = Values<{
    [K in keyof T]: T[K] extends U ? K : never;
}>;
export type MethodsOnly<T> = Pick<T, PropertiesAssignableToType<T, Function>>;
export type MaybePromise<T> = T | Promise<T>;
type RemoteFunctionArgs<T extends any[]> = {
    [K in keyof T]: HandlerType<T[K]>;
};
interface RemoteArray<T> extends Array<RemoteType<T>> {
}
export type RemoteType<T> = T extends (...args: infer Args) => infer Return ? (...args: RemoteFunctionArgs<Args>) => Promise<RemoteType<Awaited<Return>>> : T extends Array<infer El> ? RemoteArray<El> : T extends Record<string, any> ? {
    [K in keyof T]: RemoteType<T[K]>;
} : T extends any[] ? {
    [K in keyof T]: RemoteType<T[K]>;
} : T;
type HandlerFunctionArgs<T extends any[]> = {
    [K in keyof T]: RemoteType<T[K]>;
};
interface HandlerArray<T> extends Array<HandlerType<T>> {
}
export type HandlerType<T> = T extends (...args: infer Args) => infer Return ? (...args: HandlerFunctionArgs<Args>) => MaybePromise<HandlerType<Awaited<Return>>> : T extends Array<infer El> ? HandlerArray<El> : T extends Record<string, any> ? {
    [K in keyof T]: HandlerType<T[K]>;
} : T extends any[] ? {
    [K in keyof T]: HandlerType<T[K]>;
} : T;
export {};
