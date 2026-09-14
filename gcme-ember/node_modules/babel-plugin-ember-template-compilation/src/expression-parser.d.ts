import type { NodePath } from '@babel/traverse';
import type * as Babel from '@babel/core';
import type { types as t } from '@babel/core';
import { ScopeLocals } from './scope-locals';
export declare class ExpressionParser {
    private babel;
    constructor(babel: typeof Babel);
    parseExpression(invokedName: string, path: NodePath<t.Expression>): unknown;
    parseArrayExpression(invokedName: string, path: NodePath<t.ArrayExpression>): unknown[];
    parseScope(invokedName: string, path: NodePath<t.ObjectProperty | t.ObjectMethod>): ScopeLocals;
    parseEval(invokedName: string, path: NodePath<t.ObjectProperty | t.ObjectMethod>): {
        isEval: true;
    };
    parseObjectExpression(invokedName: string, path: NodePath<t.ObjectExpression>, shouldParseScope?: boolean, shouldSupportRFC931?: boolean): Record<string, unknown>;
    private get t();
}
