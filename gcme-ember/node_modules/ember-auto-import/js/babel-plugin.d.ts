import type * as Babel from '@babel/core';
import type { types as t, NodePath } from '@babel/core';
declare function emberAutoImport(babel: typeof Babel): {
    inherits: any;
    visitor: {
        Import(path: NodePath<t.Import>, state: any): void;
        CallExpression(path: NodePath<t.CallExpression>): void;
    };
};
declare namespace emberAutoImport {
    var baseDir: () => string;
}
export = emberAutoImport;
