export interface Descriptor {
    configurable?: boolean;
    enumerable?: boolean;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
    initializer?: null | (() => any);
    value?: any;
}
export type LegacyDecorator = (target: object, prop: unknown, desc: Descriptor) => Descriptor | null | undefined | void;
export type LegacyClassDecorator = (target: new (...args: any) => any) => {
    new (...args: any): any;
} | null | undefined | void;
declare function decorateFieldV1(target: {
    prototype: object;
}, prop: string | number | symbol, decorators: LegacyDecorator[], initializer?: () => any): void;
declare function decorateFieldV2(prototype: object, prop: string | number | symbol, decorators: LegacyDecorator[], initializer?: () => any): void;
declare function decorateMethodV1({ prototype }: {
    prototype: object;
}, prop: string | number | symbol, decorators: LegacyDecorator[]): void;
declare function decorateMethodV2(prototype: object, prop: string | number | symbol, decorators: LegacyDecorator[]): void;
declare function initializeDeferredDecorator(target: object, prop: string | number | symbol): void;
declare function decorateClass(target: new (...args: any) => any, decorators: LegacyClassDecorator[]): new (...args: any) => any;
declare function decoratePOJO(pojo: object, decorated: [
    'field' | 'method',
    string | number | symbol,
    LegacyDecorator[]
][]): object;
export { decorateFieldV1 as f, decorateFieldV2 as g, decorateMethodV1 as m, decorateMethodV2 as n, initializeDeferredDecorator as i, decorateClass as c, decoratePOJO as p, };
