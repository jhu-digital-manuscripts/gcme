import type * as Babel from '@babel/core';
import type { types as t, NodePath } from '@babel/core';
export declare class ImportUtil {
    private babel;
    private program;
    private t;
    constructor(babel: typeof Babel, program: NodePath<t.Program>);
    removeImport(moduleSpecifier: string, exportedName: string): void;
    removeAllImports(moduleSpecifier: string): void;
    import(target: NodePath<t.Node>, moduleSpecifier: string, exportedName: string, nameHint?: string): t.Identifier;
    private unreferencedImport;
    importForSideEffect(moduleSpecifier: string): void;
    replaceWith<T extends t.Node, R extends t.Node>(target: NodePath<T>, fn: (i: Importer) => R): NodePath<R>;
    insertAfter<T extends t.Node, R extends t.Node>(target: NodePath<T>, fn: (i: Importer) => R): NodePath<R>;
    insertBefore<T extends t.Node, R extends t.Node>(target: NodePath<T>, fn: (i: Importer) => R): NodePath<R>;
    mutate<Replacement extends t.Node>(fn: (importer: Importer) => NodePath<Replacement>, defaultNameHint?: string): NodePath<Replacement>;
    private addSpecifier;
    private buildSpecifier;
    private findImportFrom;
    private insertAfterExistingImports;
}
export interface Importer {
    import(moduleSpecifier: string, exportedName: string, nameHint?: string): t.Identifier;
}
