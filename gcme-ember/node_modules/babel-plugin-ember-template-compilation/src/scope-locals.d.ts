import type { NodePath } from '@babel/traverse';
import type { ASTPluginEnvironment, NodeVisitor } from '@glimmer/syntax';
/**
 * RFC: https://github.com/emberjs/rfcs/pull/1070
 *
 * Criteria for inclusion in this list:
 *
 *   Any of:
 *     - begins with an uppercase letter
 *     - guaranteed to never be added to glimmer as a keyword (e.g.: globalThis)
 *
 *   And:
 *     - must not need new to invoke
 *     - must not require lifetime management (e.g.: setTimeout)
 *     - must not be a single-word lower-case API, because of potential collision with future new HTML elements
 *     - if the API is a function, the return value should not be a promise
 *     - must be one one of these lists:
 *        - https://tc39.es/ecma262/#sec-global-object
 *        - https://tc39.es/ecma262/#sec-function-properties-of-the-global-object
 *        - https://html.spec.whatwg.org/multipage/nav-history-apis.html#window
 *        - https://html.spec.whatwg.org/multipage/indices.html#all-interfaces
 *        - https://html.spec.whatwg.org/multipage/webappapis.html
 */
export declare const ALLOWED_GLOBALS: Set<string>;
type Params = {
    mode: 'explicit';
} | {
    mode: 'implicit';
    jsPath: NodePath;
    mayUseLexicalThis: boolean;
};
export declare class ScopeLocals {
    #private;
    constructor(params: Params);
    get locals(): string[];
    has(key: string): boolean;
    get(key: string): string;
    isEmpty(): boolean;
    entries(): [string, string][];
    add(hbsName: string, jsName?: string): void;
    crawl(): (_env: ASTPluginEnvironment) => {
        name: string;
        visitor: NodeVisitor;
    };
}
export {};
