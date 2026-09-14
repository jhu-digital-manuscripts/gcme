export interface IPlatform {
    setTimeout(fn: Function, ms: number): any;
    clearTimeout(id: any): void;
    next(): any;
    clearNext(): void;
    now(): number;
}
export declare function buildNext(flush: () => void): () => void;
export declare function buildPlatform(flush: () => void): IPlatform;
