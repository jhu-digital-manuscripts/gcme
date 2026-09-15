import Helper from '@ember/component/helper';
import type { ComponentLike } from '@glint/template';
export type ElementFromTagName<T extends string> = T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element;
type Positional<T extends string> = [name: T];
type Return<T extends string> = ComponentLike<{
    Element: ElementFromTagName<T>;
    Blocks: {
        default: [];
    };
}>;
export interface ElementSignature<T extends string> {
    Args: {
        Positional: Positional<T>;
    };
    Return: Return<T> | undefined;
}
export default class ElementHelper<T extends string> extends Helper<ElementSignature<T>> {
    tagName: string | (() => void);
    componentClass?: Return<T>;
    compute(params: Positional<T>, hash: object): Return<T> | undefined;
}
export {};
//# sourceMappingURL=element.d.ts.map