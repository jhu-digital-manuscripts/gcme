import { types as t } from '@babel/core';
import { ImportUtil, Importer } from 'babel-import-util';
import type * as Babel from '@babel/core';
interface State extends Babel.PluginPass {
    currentClassBodies: t.ClassBody[];
    currentObjectExpressions: {
        node: t.ObjectExpression;
        decorated: [
            'field' | 'method',
            t.Expression,
            t.Expression[]
        ][];
    }[];
    opts: Options;
    runtime: (i: Importer, fnName: string) => t.Expression;
    util: ImportUtil;
    optsWithDefaults: Required<Options>;
}
export interface Options {
    runtime?: 'globals' | {
        import: string;
    };
    runEarly?: boolean;
}
export default function legacyDecoratorCompat(babel: typeof Babel): Babel.PluginObj<State>;
export {};
