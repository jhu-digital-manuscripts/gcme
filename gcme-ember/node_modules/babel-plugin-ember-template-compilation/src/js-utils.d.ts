import type { types as t } from '@babel/core';
import type * as Babel from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { ASTPluginBuilder, ASTPluginEnvironment, ASTv1, WalkerPath } from '@glimmer/syntax';
import type { ImportUtil } from 'babel-import-util';
interface State {
    program: NodePath<Babel.types.Program>;
    lastInsertedPath: NodePath<Babel.types.Statement> | undefined;
}
export declare class JSUtils {
    #private;
    constructor(babel: typeof Babel, state: State, template: NodePath<t.Expression>, addedBinding: (name: string) => void, importer: ImportUtil);
    /**
     * Create a new binding that you can use in your template, initialized with
     * the given Javascript expression.
     *
     * @param { Expression } expression A javascript expression whose value will
     * initialize your new binding. See docs on the Expression type for details.
     * @param target The location within your template where the binding will be
     * used. This matters so we can avoid naming collisions.
     * @param opts.nameHint Optionally, provide a descriptive name for your new
     * binding. We will mangle this name as needed to avoid collisions, but
     * picking a good name here can aid in debugging.
     *
     * @return The name you can use in your template to access the binding.
     */
    bindExpression(expression: Expression, target: WalkerPath<ASTv1.Node>, opts?: {
        nameHint?: string;
    }): string;
    /**
     * Gain access to an imported value within your template.
     *
     * @param moduleSpecifier The path to import from.
     * @param exportedName The named export you wish to access, or "default" for
     * the default export, or "*" for the namespace export.
     * @param target The location within your template where the binding will be
     * used. This matters so we can avoid naming collisions.
     * @param opts.nameHint Optionally, provide a descriptive name for your new
     * binding. We will mangle this name as needed to avoid collisions, but
     * picking a good name here can aid in debugging.
     *
     * @return The name you can use in your template to access the imported value.
     */
    bindImport(moduleSpecifier: string, exportedName: string, target: WalkerPath<ASTv1.Node>, opts?: {
        nameHint?: string;
    }): string;
    /**
     * Add an import statement purely for side effect.
     *
     * @param moduleSpecifier the module to import
     */
    importForSideEffect(moduleSpecifier: string): void;
    /**
     * Emit a javascript expresison for side-effect. This only accepts
     * expressions, not statements, because you should not introduce new bindings.
     * To introduce a binding see bindExpression or bindImport instead.
     *
     * @param { Expression } expression A javascript expression whose value will
     * initialize your new binding. See docs on the Expression type below for
     * details.
     */
    emitExpression(expression: Expression): void;
}
/**
 * This extends Glimmer's ASTPluginEnvironment type to put our jsutils into meta
 */
export type WithJSUtils<T extends {
    meta?: object;
}> = {
    meta: T['meta'] & {
        jsutils: JSUtils;
    };
} & T;
export type ExtendedPluginBuilder = ASTPluginBuilder<WithJSUtils<ASTPluginEnvironment>>;
/**
 * Allows you to construct an expression that relies on imported values.
 */
declare class ExpressionContext {
    #private;
    constructor(importer: ImportUtil, target: NodePath<t.Node>);
    /**
     * Find or create a local binding for the given import.
     *
     * @param moduleSpecifier The path to import from.
     * @param exportedName The named export you wish to access, or "default" for
     * the default export, or "*" for the namespace export.
     * @param nameHint Optionally, provide a descriptive name for your new
     * binding. We will mangle this name as needed to avoid collisions, but
     * picking a good name here can aid in debugging.
  
     * @return the local identifier for the imported value
     */
    import(moduleSpecifier: string, exportedName: string, nameHint?: string): string;
}
/**
 * You can pass a Javascript expression as a string like:
 *
 *   "new Date()"
 *
 * Or as a function that returns a string:
 *
 *   () => "new Date()"
 *
 * When you use a function, it can use imported values:
 *
 *   (context) => `new ${context.import("luxon", "DateTime")}()`
 *
 */
export type Expression = string | ((context: ExpressionContext) => string);
export {};
