export declare type Present = {} | void;
export declare type Option<T> = T | null;
export declare type Maybe<T> = Option<T> | undefined | void;
export declare type Recast<T, U> = (T & U) | U;
export interface Dict<T> {
    [key: string]: T;
}
