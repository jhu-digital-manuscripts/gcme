"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _JSUtils_instances, _JSUtils_babel, _JSUtils_state, _JSUtils_template, _JSUtils_addedBinding, _JSUtils_importer, _JSUtils_emitStatement, _JSUtils_parseExpression, _ExpressionContext_importer, _ExpressionContext_target;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSUtils = void 0;
const hbs_utils_1 = require("./hbs-utils");
// This exists to give AST plugins a controlled interface for influencing the
// surrounding Javascript scope
class JSUtils {
    constructor(babel, state, template, addedBinding, importer) {
        _JSUtils_instances.add(this);
        _JSUtils_babel.set(this, void 0);
        _JSUtils_state.set(this, void 0);
        _JSUtils_template.set(this, void 0);
        _JSUtils_addedBinding.set(this, void 0);
        _JSUtils_importer.set(this, void 0);
        __classPrivateFieldSet(this, _JSUtils_babel, babel, "f");
        __classPrivateFieldSet(this, _JSUtils_state, state, "f");
        __classPrivateFieldSet(this, _JSUtils_template, template, "f");
        __classPrivateFieldSet(this, _JSUtils_addedBinding, addedBinding, "f");
        __classPrivateFieldSet(this, _JSUtils_importer, importer, "f");
        if (!__classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath) {
            let target;
            for (let statement of __classPrivateFieldGet(this, _JSUtils_state, "f").program.get('body')) {
                if (!statement.isImportDeclaration()) {
                    break;
                }
                target = statement;
            }
            if (target) {
                __classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath = target;
            }
        }
    }
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
    bindExpression(expression, target, opts) {
        var _a;
        let name = unusedNameLike((_a = opts === null || opts === void 0 ? void 0 : opts.nameHint) !== null && _a !== void 0 ? _a : 'a', (candidate) => __classPrivateFieldGet(this, _JSUtils_template, "f").scope.hasBinding(candidate) || (0, hbs_utils_1.astNodeHasBinding)(target, candidate));
        let t = __classPrivateFieldGet(this, _JSUtils_babel, "f").types;
        let declaration = __classPrivateFieldGet(this, _JSUtils_instances, "m", _JSUtils_emitStatement).call(this, t.variableDeclaration('let', [
            t.variableDeclarator(t.identifier(name), __classPrivateFieldGet(this, _JSUtils_instances, "m", _JSUtils_parseExpression).call(this, __classPrivateFieldGet(this, _JSUtils_state, "f").program, expression)),
        ]));
        declaration.scope.registerBinding('let', declaration.get('declarations.0'));
        __classPrivateFieldGet(this, _JSUtils_addedBinding, "f").call(this, name);
        return name;
    }
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
    bindImport(moduleSpecifier, exportedName, target, opts) {
        // This will discover or create the local name for accessing the given import.
        let importedIdentifier = __classPrivateFieldGet(this, _JSUtils_importer, "f").import(__classPrivateFieldGet(this, _JSUtils_template, "f"), moduleSpecifier, exportedName, opts === null || opts === void 0 ? void 0 : opts.nameHint);
        // Simple base case: the JS name that's available is also unused at our spot
        // in HBS, so just use it.
        if (!(0, hbs_utils_1.astNodeHasBinding)(target, importedIdentifier.name)) {
            __classPrivateFieldGet(this, _JSUtils_addedBinding, "f").call(this, importedIdentifier.name);
            return importedIdentifier.name;
        }
        // The importedIdentifier that we have in Javascript is not usable within
        // our HBS because it's shadowed by a block param. So we will introduce a
        // second name via a variable declaration.
        //
        // The reason we don't force the import itself to have this name is that
        // we might be re-using an existing import, and we don't want to go
        // rewriting all of its callsites that are unrelated to us.
        let identifier = unusedNameLike(importedIdentifier.name, (candidate) => __classPrivateFieldGet(this, _JSUtils_template, "f").scope.hasBinding(candidate) || (0, hbs_utils_1.astNodeHasBinding)(target, candidate));
        let t = __classPrivateFieldGet(this, _JSUtils_babel, "f").types;
        let declaration = __classPrivateFieldGet(this, _JSUtils_instances, "m", _JSUtils_emitStatement).call(this, t.variableDeclaration('let', [
            t.variableDeclarator(t.identifier(identifier), importedIdentifier),
        ]));
        declaration.scope.registerBinding('let', declaration.get('declarations.0'));
        __classPrivateFieldGet(this, _JSUtils_addedBinding, "f").call(this, identifier);
        return identifier;
    }
    /**
     * Add an import statement purely for side effect.
     *
     * @param moduleSpecifier the module to import
     */
    importForSideEffect(moduleSpecifier) {
        __classPrivateFieldGet(this, _JSUtils_importer, "f").importForSideEffect(moduleSpecifier);
    }
    /**
     * Emit a javascript expresison for side-effect. This only accepts
     * expressions, not statements, because you should not introduce new bindings.
     * To introduce a binding see bindExpression or bindImport instead.
     *
     * @param { Expression } expression A javascript expression whose value will
     * initialize your new binding. See docs on the Expression type below for
     * details.
     */
    emitExpression(expression) {
        let t = __classPrivateFieldGet(this, _JSUtils_babel, "f").types;
        __classPrivateFieldGet(this, _JSUtils_instances, "m", _JSUtils_emitStatement).call(this, t.expressionStatement(__classPrivateFieldGet(this, _JSUtils_instances, "m", _JSUtils_parseExpression).call(this, __classPrivateFieldGet(this, _JSUtils_state, "f").program, expression)));
    }
}
exports.JSUtils = JSUtils;
_JSUtils_babel = new WeakMap(), _JSUtils_state = new WeakMap(), _JSUtils_template = new WeakMap(), _JSUtils_addedBinding = new WeakMap(), _JSUtils_importer = new WeakMap(), _JSUtils_instances = new WeakSet(), _JSUtils_emitStatement = function _JSUtils_emitStatement(statement) {
    if (__classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath) {
        __classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath = __classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath.insertAfter(statement)[0];
    }
    else {
        __classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath = __classPrivateFieldGet(this, _JSUtils_state, "f").program.unshiftContainer('body', statement)[0];
    }
    return __classPrivateFieldGet(this, _JSUtils_state, "f").lastInsertedPath;
}, _JSUtils_parseExpression = function _JSUtils_parseExpression(target, expression) {
    let expressionString;
    if (typeof expression === 'string') {
        expressionString = expression;
    }
    else {
        expressionString = expression(new ExpressionContext(__classPrivateFieldGet(this, _JSUtils_importer, "f"), target));
    }
    let parsed = __classPrivateFieldGet(this, _JSUtils_babel, "f").parse(expressionString);
    if (!parsed) {
        throw new Error(`JSUtils.bindExpression could not understand the expression: ${expressionString}`);
    }
    let statements = body(parsed);
    if (statements.length !== 1) {
        throw new Error(`JSUtils.bindExpression expected to find exactly one expression but found ${statements.length} in: ${expressionString}`);
    }
    let statement = statements[0];
    if (statement.type !== 'ExpressionStatement') {
        throw new Error(`JSUtils.bindExpression expected to find an expression but found ${statement.type} in: ${expressionString}`);
    }
    return statement.expression;
};
function unusedNameLike(desiredName, isUsed) {
    let candidate = desiredName;
    let counter = 0;
    while (isUsed(candidate)) {
        candidate = `${desiredName}${counter++}`;
    }
    return candidate;
}
function body(node) {
    if (node.type === 'File') {
        return node.program.body;
    }
    else {
        return node.body;
    }
}
/**
 * Allows you to construct an expression that relies on imported values.
 */
class ExpressionContext {
    constructor(importer, target) {
        _ExpressionContext_importer.set(this, void 0);
        _ExpressionContext_target.set(this, void 0);
        __classPrivateFieldSet(this, _ExpressionContext_importer, importer, "f");
        __classPrivateFieldSet(this, _ExpressionContext_target, target, "f");
    }
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
    import(moduleSpecifier, exportedName, nameHint) {
        // this method in babel-import-util is the lower-level one that doesn't try
        // to create valid references for us. It's our responsibility to do so. But
        // that's OK here, because we have the same responsibility for every
        // scope-bag identifier, not just the imported ones, and it will be easier
        // to handle them all at once.
        return __classPrivateFieldGet(this, _ExpressionContext_importer, "f").import(__classPrivateFieldGet(this, _ExpressionContext_target, "f"), moduleSpecifier, exportedName, nameHint).name;
    }
}
_ExpressionContext_importer = new WeakMap(), _ExpressionContext_target = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianMtdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJqcy11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFLQSwyQ0FBZ0Q7QUFPaEQsNkVBQTZFO0FBQzdFLCtCQUErQjtBQUMvQixNQUFhLE9BQU87SUFPbEIsWUFDRSxLQUFtQixFQUNuQixLQUFZLEVBQ1osUUFBZ0MsRUFDaEMsWUFBb0MsRUFDcEMsUUFBb0I7O1FBWHRCLGlDQUFxQjtRQUNyQixpQ0FBYztRQUNkLG9DQUFrQztRQUNsQyx3Q0FBc0M7UUFDdEMsb0NBQXNCO1FBU3BCLHVCQUFBLElBQUksa0JBQVUsS0FBSyxNQUFBLENBQUM7UUFDcEIsdUJBQUEsSUFBSSxrQkFBVSxLQUFLLE1BQUEsQ0FBQztRQUNwQix1QkFBQSxJQUFJLHFCQUFhLFFBQVEsTUFBQSxDQUFDO1FBQzFCLHVCQUFBLElBQUkseUJBQWlCLFlBQVksTUFBQSxDQUFDO1FBQ2xDLHVCQUFBLElBQUkscUJBQWEsUUFBUSxNQUFBLENBQUM7UUFFMUIsSUFBSSxDQUFDLHVCQUFBLElBQUksc0JBQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ2xDLElBQUksTUFBeUMsQ0FBQztZQUM5QyxLQUFLLElBQUksU0FBUyxJQUFJLHVCQUFBLElBQUksc0JBQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDO29CQUNyQyxNQUFNO2dCQUNSLENBQUM7Z0JBQ0QsTUFBTSxHQUFHLFNBQVMsQ0FBQztZQUNyQixDQUFDO1lBQ0QsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDWCx1QkFBQSxJQUFJLHNCQUFPLENBQUMsZ0JBQWdCLEdBQUcsTUFBTSxDQUFDO1lBQ3hDLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7O09BYUc7SUFDSCxjQUFjLENB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LEVBQUUsQ0FBQztJQUMzQyxDQUFDO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQVdELFNBQVMsSUFBSSxDQUFDLElBQXdCO0lBQ3BDLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztRQUN6QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0lBQzNCLENBQUM7U0FBTSxDQUFDO1FBQ04sT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ25CLENBQUM7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLGlCQUFpQjtJQUlyQixZQUFZLFFBQW9CLEVBQUUsTUFBd0I7UUFIMUQsOENBQXNCO1FBQ3RCLDRDQUEwQjtRQUd4Qix1QkFBQSxJQUFJLCtCQUFhLFFBQVEsTUFBQSxDQUFDO1FBQzFCLHVCQUFBLElBQUksNkJBQVcsTUFBTSxNQUFBLENBQUM7SUFDeEIsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsTUFBTSxDQUFDLGVBQXVCLEVBQUUsWUFBb0IsRUFBRSxRQUFpQjtRQUNyRSwyRUFBMkU7UUFDM0UsMkVBQTJFO1FBQzNFLG9FQUFvRTtRQUNwRSwwRUFBMEU7UUFDMUUsOEJBQThCO1FBQzlCLE9BQU8sdUJBQUEsSUFBSSxtQ0FBVSxDQUFDLE1BQU0sQ0FBQyx1QkFBQSxJQUFJLGlDQUFRLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDM0YsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyB0eXBlcyBhcyB0IH0gZnJvbSAnQGJhYmVsL2NvcmUnO1xuaW1wb3J0IHR5cGUgKiBhcyBCYWJlbCBmcm9tICdAYmFiZWwvY29yZSc7XG5pbXBvcnQgdHlwZSB7IE5vZGVQYXRoIH0gZnJvbSAnQGJhYmVsL3RyYXZlcnNlJztcbmltcG9ydCB0eXBlIHsgQVNUUGx1Z2luQnVpbGRlciwgQVNUUGx1Z2luRW52aXJvbm1lbnQsIEFTVHYxLCBXYWxrZXJQYXRoIH0gZnJvbSAnQGdsaW1tZXIvc3ludGF4JztcbmltcG9ydCB0eXBlIHsgSW1wb3J0VXRpbCB9IGZyb20gJ2JhYmVsLWltcG9ydC11dGlsJztcbmltcG9ydCB7IGFzdE5vZGVIYXNCaW5kaW5nIH0gZnJvbSAnLi9oYnMtdXRpbHMnO1xuXG5pbnRlcmZhY2UgU3RhdGUge1xuICBwcm9ncmFtOiBOb2RlUGF0aDxCYWJlbC50eXBlcy5Qcm9ncmFtPjtcbiAgbGFzdEluc2VydGVkUGF0aDogTm9kZVBhdGg8QmFiZWwudHlwZXMuU3RhdGVtZW50PiB8IHVuZGVmaW5lZDtcbn1cblxuLy8gVGhpcyBleGlzdHMgdG8gZ2l2ZSBBU1QgcGx1Z2lucyBhIGNvbnRyb2xsZWQgaW50ZXJmYWNlIGZvciBpbmZsdWVuY2luZyB0aGVcbi8vIHN1cnJvdW5kaW5nIEphdmFzY3JpcHQgc2NvcGVcbmV4cG9ydCBjbGFzcyBKU1V0aWxzIHtcbiAgI2JhYmVsOiB0eXBlb2YgQmFiZWw7XG4gICNzdGF0ZTogU3RhdGU7XG4gICN0ZW1wbGF0ZTogTm9kZVBhdGg8dC5FeHByZXNzaW9uPjtcbiAgI2FkZGVkQmluZGluZzogKG5hbWU6IHN0cmluZykgPT4gdm9pZDtcbiAgI2ltcG9ydGVyOiBJbXBvcnRVdGlsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGJhYmVsOiB0eXBlb2YgQmFiZWwsXG4gICAgc3RhdGU6IFN0YXRlLFxuICAgIHRlbXBsYXRlOiBOb2RlUGF0aDx0LkV4cHJlc3Npb24+LFxuICAgIGFkZGVkQmluZGluZzogKG5hbWU6IHN0cmluZykgPT4gdm9pZCxcbiAgICBpbXBvcnRlcjogSW1wb3J0VXRpbFxuICApIHtcbiAgICB0aGlzLiNiYWJlbCA9IGJhYmVsO1xuICAgIHRoaXMuI3N0YXRlID0gc3RhdGU7XG4gICAgdGhpcy4jdGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICB0aGlzLiNhZGRlZEJpbmRpbmcgPSBhZGRlZEJpbmRpbmc7XG4gICAgdGhpcy4jaW1wb3J0ZXIgPSBpbXBvcnRlcjtcblxuICAgIGlmICghdGhpcy4jc3RhdGUubGFzdEluc2VydGVkUGF0aCkge1xuICAgICAgbGV0IHRhcmdldDogTm9kZVBhdGg8dC5TdGF0ZW1lbnQ+IHwgdW5kZWZpbmVkO1xuICAgICAgZm9yIChsZXQgc3RhdGVtZW50IG9mIHRoaXMuI3N0YXRlLnByb2dyYW0uZ2V0KCdib2R5JykpIHtcbiAgICAgICAgaWYgKCFzdGF0ZW1lbnQuaXNJbXBvcnREZWNsYXJhdGlvbigpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0ID0gc3RhdGVtZW50O1xuICAgICAgfVxuICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICB0aGlzLiNzdGF0ZS5sYXN0SW5zZXJ0ZWRQYXRoID0gdGFyZ2V0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgYmluZGluZyB0aGF0IHlvdSBjYW4gdXNlIGluIHlvdXIgdGVtcGxhdGUsIGluaXRpYWxpemVkIHdpdGhcbiAgICogdGhlIGdpdmVuIEphdmFzY3JpcHQgZXhwcmVzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHsgRXhwcmVzc2lvbiB9IGV4cHJlc3Npb24gQSBqYXZhc2NyaXB0IGV4cHJlc3Npb24gd2hvc2UgdmFsdWUgd2lsbFxuICAgKiBpbml0aWFsaXplIHlvdXIgbmV3IGJpbmRpbmcuIFNlZSBkb2NzIG9uIHRoZSBFeHByZXNzaW9uIHR5cGUgZm9yIGRldGFpbHMuXG4gICAqIEBwYXJhbSB0YXJnZXQgVGhlIGxvY2F0aW9uIHdpdGhpbiB5b3VyIHRlbXBsYXRlIHdoZXJlIHRoZSBiaW5kaW5nIHdpbGwgYmVcbiAgICogdXNlZC4gVGhpcyBtYXR0ZXJzIHNvIHdlIGNhbiBhdm9pZCBuYW1pbmcgY29sbGlzaW9ucy5cbiAgICogQHBhcmFtIG9wdHMubmFtZUhpbnQgT3B0aW9uYWxseSwgcHJvdmlkZSBhIGRlc2NyaXB0aXZlIG5hbWUgZm9yIHlvdXIgbmV3XG4gICAqIGJpbmRpbmcuIFdlIHdpbGwgbWFuZ2xlIHRoaXMgbmFtZSBhcyBuZWVkZWQgdG8gYXZvaWQgY29sbGlzaW9ucywgYnV0XG4gICAqIHBpY2tpbmcgYSBnb29kIG5hbWUgaGVyZSBjYW4gYWlkIGluIGRlYnVnZ2luZy5cbiAgICpcbiAgICogQHJldHVybiBUaGUgbmFtZSB5b3UgY2FuIHVzZSBpbiB5b3VyIHRlbXBsYXRlIHRvIGFjY2VzcyB0aGUgYmluZGluZy5cbiAgICovXG4gIGJpbmRFeHByZXNzaW9uKFxuICAgIGV4cHJlc3Npb246IEV4cHJlc3Npb24sXG4gICAgdGFyZ2V0OiBXYWxrZXJQYXRoPEFTVHYxLk5vZGU+LFxuICAgIG9wdHM/OiB7IG5hbWVIaW50Pzogc3RyaW5nIH1cbiAgKTogc3RyaW5nIHtcbiAgICBsZXQgbmFtZSA9IHVudXNlZE5hbWVMaWtlKFxuICAgICAgb3B0cz8ubmFtZUhpbnQgPz8gJ2EnLFxuICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgdGhpcy4jdGVtcGxhdGUuc2NvcGUuaGFzQmluZGluZyhjYW5kaWRhdGUpIHx8IGFzdE5vZGVIYXNCaW5kaW5nKHRhcmdldCwgY2FuZGlkYXRlKVxuICAgICk7XG4gICAgbGV0IHQgPSB0aGlzLiNiYWJlbC50eXBlcztcbiAgICBsZXQgZGVjbGFyYXRpb246IE5vZGVQYXRoPHQuVmFyaWFibGVEZWNsYXJhdGlvbj4gPSB0aGlzLiNlbWl0U3RhdGVtZW50KFxuICAgICAgdC52YXJpYWJsZURlY2xhcmF0aW9uKCdsZXQnLCBbXG4gICAgICAgIHQudmFyaWFibGVEZWNsYXJhdG9yKFxuICAgICAgICAgIHQuaWRlbnRpZmllcihuYW1lKSxcbiAgICAgICAgICB0aGlzLiNwYXJzZUV4cHJlc3Npb24odGhpcy4jc3RhdGUucHJvZ3JhbSwgZXhwcmVzc2lvbilcbiAgICAgICAgKSxcbiAgICAgIF0pXG4gICAgKTtcbiAgICBkZWNsYXJhdGlvbi5zY29wZS5yZWdpc3RlckJpbmRpbmcoJ2xldCcsIGRlY2xhcmF0aW9uLmdldCgnZGVjbGFyYXRpb25zLjAnKSBhcyBOb2RlUGF0aCk7XG4gICAgdGhpcy4jYWRkZWRCaW5kaW5nKG5hbWUpO1xuICAgIHJldHVybiBuYW1lO1xuICB9XG5cbiAgI2VtaXRTdGF0ZW1lbnQ8VCBleHRlbmRzIHQuU3RhdGVtZW50PihzdGF0ZW1lbnQ6IFQpOiBOb2RlUGF0aDxUPiB7XG4gICAgaWYgKHRoaXMuI3N0YXRlLmxhc3RJbnNlcnRlZFBhdGgpIHtcbiAgICAgIHRoaXMuI3N0YXRlLmxhc3RJbnNlcnRlZFBhdGggPSB0aGlzLiNzdGF0ZS5sYXN0SW5zZXJ0ZWRQYXRoLmluc2VydEFmdGVyKHN0YXRlbWVudClbMF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI3N0YXRlLmxhc3RJbnNlcnRlZFBhdGggPSB0aGlzLiNzdGF0ZS5wcm9ncmFtLnVuc2hpZnRDb250YWluZXIoJ2JvZHknLCBzdGF0ZW1lbnQpWzBdO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jc3RhdGUubGFzdEluc2VydGVkUGF0aCBhcyBOb2RlUGF0aDxUPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHYWluIGFjY2VzcyB0byBhbiBpbXBvcnRlZCB2YWx1ZSB3aXRoaW4geW91ciB0ZW1wbGF0ZS5cbiAgICpcbiAgICogQHBhcmFtIG1vZHVsZVNwZWNpZmllciBUaGUgcGF0aCB0byBpbXBvcnQgZnJvbS5cbiAgICogQHBhcmFtIGV4cG9ydGVkTmFtZSBUaGUgbmFtZWQgZXhwb3J0IHlvdSB3aXNoIHRvIGFjY2Vzcywgb3IgXCJkZWZhdWx0XCIgZm9yXG4gICAqIHRoZSBkZWZhdWx0IGV4cG9ydCwgb3IgXCIqXCIgZm9yIHRoZSBuYW1lc3BhY2UgZXhwb3J0LlxuICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSBsb2NhdGlvbiB3aXRoaW4geW91ciB0ZW1wbGF0ZSB3aGVyZSB0aGUgYmluZGluZyB3aWxsIGJlXG4gICAqIHVzZWQuIFRoaXMgbWF0dGVycyBzbyB3ZSBjYW4gYXZvaWQgbmFtaW5nIGNvbGxpc2lvbnMuXG4gICAqIEBwYXJhbSBvcHRzLm5hbWVIaW50IE9wdGlvbmFsbHksIHByb3ZpZGUgYSBkZXNjcmlwdGl2ZSBuYW1lIGZvciB5b3VyIG5ld1xuICAgKiBiaW5kaW5nLiBXZSB3aWxsIG1hbmdsZSB0aGlzIG5hbWUgYXMgbmVlZGVkIHRvIGF2b2lkIGNvbGxpc2lvbnMsIGJ1dFxuICAgKiBwaWNraW5nIGEgZ29vZCBuYW1lIGhlcmUgY2FuIGFpZCBpbiBkZWJ1Z2dpbmcuXG4gICAqXG4gICAqIEByZXR1cm4gVGhlIG5hbWUgeW91IGNhbiB1c2UgaW4geW91ciB0ZW1wbGF0ZSB0byBhY2Nlc3MgdGhlIGltcG9ydGVkIHZhbHVlLlxuICAgKi9cbiAgYmluZEltcG9ydChcbiAgICBtb2R1bGVTcGVjaWZpZXI6IHN0cmluZyxcbiAgICBleHBvcnRlZE5hbWU6IHN0cmluZyxcbiAgICB0YXJnZXQ6IFdhbGtlclBhdGg8QVNUdjEuTm9kZT4sXG4gICAgb3B0cz86IHsgbmFtZUhpbnQ/OiBzdHJpbmcgfVxuICApOiBzdHJpbmcge1xuICAgIC8vIFRoaXMgd2lsbCBkaXNjb3ZlciBvciBjcmVhdGUgdGhlIGxvY2FsIG5hbWUgZm9yIGFjY2Vzc2luZyB0aGUgZ2l2ZW4gaW1wb3J0LlxuICAgIGxldCBpbXBvcnRlZElkZW50aWZpZXIgPSB0aGlzLiNpbXBvcnRlci5pbXBvcnQoXG4gICAgICB0aGlzLiN0ZW1wbGF0ZSxcbiAgICAgIG1vZHVsZVNwZWNpZmllcixcbiAgICAgIGV4cG9ydGVkTmFtZSxcbiAgICAgIG9wdHM/Lm5hbWVIaW50XG4gICAgKTtcblxuICAgIC8vIFNpbXBsZSBiYXNlIGNhc2U6IHRoZSBKUyBuYW1lIHRoYXQncyBhdmFpbGFibGUgaXMgYWxzbyB1bnVzZWQgYXQgb3VyIHNwb3RcbiAgICAvLyBpbiBIQlMsIHNvIGp1c3QgdXNlIGl0LlxuICAgIGlmICghYXN0Tm9kZUhhc0JpbmRpbmcodGFyZ2V0LCBpbXBvcnRlZElkZW50aWZpZXIubmFtZSkpIHtcbiAgICAgIHRoaXMuI2FkZGVkQmluZGluZyhpbXBvcnRlZElkZW50aWZpZXIubmFtZSk7XG4gICAgICByZXR1cm4gaW1wb3J0ZWRJZGVudGlmaWVyLm5hbWU7XG4gICAgfVxuXG4gICAgLy8gVGhlIGltcG9ydGVkSWRlbnRpZmllciB0aGF0IHdlIGhhdmUgaW4gSmF2YXNjcmlwdCBpcyBub3QgdXNhYmxlIHdpdGhpblxuICAgIC8vIG91ciBIQlMgYmVjYXVzZSBpdCdzIHNoYWRvd2VkIGJ5IGEgYmxvY2sgcGFyYW0uIFNvIHdlIHdpbGwgaW50cm9kdWNlIGFcbiAgICAvLyBzZWNvbmQgbmFtZSB2aWEgYSB2YXJpYWJsZSBkZWNsYXJhdGlvbi5cbiAgICAvL1xuICAgIC8vIFRoZSByZWFzb24gd2UgZG9uJ3QgZm9yY2UgdGhlIGltcG9ydCBpdHNlbGYgdG8gaGF2ZSB0aGlzIG5hbWUgaXMgdGhhdFxuICAgIC8vIHdlIG1pZ2h0IGJlIHJlLXVzaW5nIGFuIGV4aXN0aW5nIGltcG9ydCwgYW5kIHdlIGRvbid0IHdhbnQgdG8gZ29cbiAgICAvLyByZXdyaXRpbmcgYWxsIG9mIGl0cyBjYWxsc2l0ZXMgdGhhdCBhcmUgdW5yZWxhdGVkIHRvIHVzLlxuICAgIGxldCBpZGVudGlmaWVyID0gdW51c2VkTmFtZUxpa2UoXG4gICAgICBpbXBvcnRlZElkZW50aWZpZXIubmFtZSxcbiAgICAgIChjYW5kaWRhdGUpID0+XG4gICAgICAgIHRoaXMuI3RlbXBsYXRlLnNjb3BlLmhhc0JpbmRpbmcoY2FuZGlkYXRlKSB8fCBhc3ROb2RlSGFzQmluZGluZyh0YXJnZXQsIGNhbmRpZGF0ZSlcbiAgICApO1xuICAgIGxldCB0ID0gdGhpcy4jYmFiZWwudHlwZXM7XG4gICAgbGV0IGRlY2xhcmF0aW9uID0gdGhpcy4jZW1pdFN0YXRlbWVudChcbiAgICAgIHQudmFyaWFibGVEZWNsYXJhdGlvbignbGV0JywgW1xuICAgICAgICB0LnZhcmlhYmxlRGVjbGFyYXRvcih0LmlkZW50aWZpZXIoaWRlbnRpZmllciksIGltcG9ydGVkSWRlbnRpZmllciksXG4gICAgICBdKVxuICAgICk7XG4gICAgZGVjbGFyYXRpb24uc2NvcGUucmVnaXN0ZXJCaW5kaW5nKCdsZXQnLCBkZWNsYXJhdGlvbi5nZXQoJ2RlY2xhcmF0aW9ucy4wJykgYXMgTm9kZVBhdGgpO1xuXG4gICAgdGhpcy4jYWRkZWRCaW5kaW5nKGlkZW50aWZpZXIpO1xuICAgIHJldHVybiBpZGVudGlmaWVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBpbXBvcnQgc3RhdGVtZW50IHB1cmVseSBmb3Igc2lkZSBlZmZlY3QuXG4gICAqXG4gICAqIEBwYXJhbSBtb2R1bGVTcGVjaWZpZXIgdGhlIG1vZHVsZSB0byBpbXBvcnRcbiAgICovXG4gIGltcG9ydEZvclNpZGVFZmZlY3QobW9kdWxlU3BlY2lmaWVyOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLiNpbXBvcnRlci5pbXBvcnRGb3JTaWRlRWZmZWN0KG1vZHVsZVNwZWNpZmllcik7XG4gIH1cblxuICAvKipcbiAgICogRW1pdCBhIGphdmFzY3JpcHQgZXhwcmVzaXNvbiBmb3Igc2lkZS1lZmZlY3QuIFRoaXMgb25seSBhY2NlcHRzXG4gICAqIGV4cHJlc3Npb25zLCBub3Qgc3RhdGVtZW50cywgYmVjYXVzZSB5b3Ugc2hvdWxkIG5vdCBpbnRyb2R1Y2UgbmV3IGJpbmRpbmdzLlxuICAgKiBUbyBpbnRyb2R1Y2UgYSBiaW5kaW5nIHNlZSBiaW5kRXhwcmVzc2lvbiBvciBiaW5kSW1wb3J0IGluc3RlYWQuXG4gICAqXG4gICAqIEBwYXJhbSB7IEV4cHJlc3Npb24gfSBleHByZXNzaW9uIEEgamF2YXNjcmlwdCBleHByZXNzaW9uIHdob3NlIHZhbHVlIHdpbGxcbiAgICogaW5pdGlhbGl6ZSB5b3VyIG5ldyBiaW5kaW5nLiBTZWUgZG9jcyBvbiB0aGUgRXhwcmVzc2lvbiB0eXBlIGJlbG93IGZvclxuICAgKiBkZXRhaWxzLlxuICAgKi9cbiAgZW1pdEV4cHJlc3Npb24oZXhwcmVzc2lvbjogRXhwcmVzc2lvbik6IHZvaWQge1xuICAgIGxldCB0ID0gdGhpcy4jYmFiZWwudHlwZXM7XG4gICAgdGhpcy4jZW1pdFN0YXRlbWVudChcbiAgICAgIHQuZXhwcmVzc2lvblN0YXRlbWVudCh0aGlzLiNwYXJzZUV4cHJlc3Npb24odGhpcy4jc3RhdGUucHJvZ3JhbSwgZXhwcmVzc2lvbikpXG4gICAgKTtcbiAgfVxuXG4gICNwYXJzZUV4cHJlc3Npb24odGFyZ2V0OiBOb2RlUGF0aDx0Lk5vZGU+LCBleHByZXNzaW9uOiBFeHByZXNzaW9uKTogdC5FeHByZXNzaW9uIHtcbiAgICBsZXQgZXhwcmVzc2lvblN0cmluZzogc3RyaW5nO1xuICAgIGlmICh0eXBlb2YgZXhwcmVzc2lvbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGV4cHJlc3Npb25TdHJpbmcgPSBleHByZXNzaW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHByZXNzaW9uU3RyaW5nID0gZXhwcmVzc2lvbihuZXcgRXhwcmVzc2lvbkNvbnRleHQodGhpcy4jaW1wb3J0ZXIsIHRhcmdldCkpO1xuICAgIH1cblxuICAgIGxldCBwYXJzZWQgPSB0aGlzLiNiYWJlbC5wYXJzZShleHByZXNzaW9uU3RyaW5nKTtcbiAgICBpZiAoIXBhcnNlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgSlNVdGlscy5iaW5kRXhwcmVzc2lvbiBjb3VsZCBub3QgdW5kZXJzdGFuZCB0aGUgZXhwcmVzc2lvbjogJHtleHByZXNzaW9uU3RyaW5nfWBcbiAgICAgICk7XG4gICAgfVxuICAgIGxldCBzdGF0ZW1lbnRzID0gYm9keShwYXJzZWQpO1xuICAgIGlmIChzdGF0ZW1lbnRzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgSlNVdGlscy5iaW5kRXhwcmVzc2lvbiBleHBlY3RlZCB0byBmaW5kIGV4YWN0bHkgb25lIGV4cHJlc3Npb24gYnV0IGZvdW5kICR7c3RhdGVtZW50cy5sZW5ndGh9IGluOiAke2V4cHJlc3Npb25TdHJpbmd9YFxuICAgICAgKTtcbiAgICB9XG4gICAgbGV0IHN0YXRlbWVudCA9IHN0YXRlbWVudHNbMF07XG4gICAgaWYgKHN0YXRlbWVudC50eXBlICE9PSAnRXhwcmVzc2lvblN0YXRlbWVudCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEpTVXRpbHMuYmluZEV4cHJlc3Npb24gZXhwZWN0ZWQgdG8gZmluZCBhbiBleHByZXNzaW9uIGJ1dCBmb3VuZCAke3N0YXRlbWVudC50eXBlfSBpbjogJHtleHByZXNzaW9uU3RyaW5nfWBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBzdGF0ZW1lbnQuZXhwcmVzc2lvbjtcbiAgfVxufVxuXG5mdW5jdGlvbiB1bnVzZWROYW1lTGlrZShkZXNpcmVkTmFtZTogc3RyaW5nLCBpc1VzZWQ6IChuYW1lOiBzdHJpbmcpID0+IGJvb2xlYW4pOiBzdHJpbmcge1xuICBsZXQgY2FuZGlkYXRlID0gZGVzaXJlZE5hbWU7XG4gIGxldCBjb3VudGVyID0gMDtcbiAgd2hpbGUgKGlzVXNlZChjYW5kaWRhdGUpKSB7XG4gICAgY2FuZGlkYXRlID0gYCR7ZGVzaXJlZE5hbWV9JHtjb3VudGVyKyt9YDtcbiAgfVxuICByZXR1cm4gY2FuZGlkYXRlO1xufVxuXG4vKipcbiAqIFRoaXMgZXh0ZW5kcyBHbGltbWVyJ3MgQVNUUGx1Z2luRW52aXJvbm1lbnQgdHlwZSB0byBwdXQgb3VyIGpzdXRpbHMgaW50byBtZXRhXG4gKi9cbmV4cG9ydCB0eXBlIFdpdGhKU1V0aWxzPFQgZXh0ZW5kcyB7IG1ldGE/OiBvYmplY3QgfT4gPSB7XG4gIG1ldGE6IFRbJ21ldGEnXSAmIHsganN1dGlsczogSlNVdGlscyB9O1xufSAmIFQ7XG5cbmV4cG9ydCB0eXBlIEV4dGVuZGVkUGx1Z2luQnVpbGRlciA9IEFTVFBsdWdpbkJ1aWxkZXI8V2l0aEpTVXRpbHM8QVNUUGx1Z2luRW52aXJvbm1lbnQ+PjtcblxuZnVuY3Rpb24gYm9keShub2RlOiB0LlByb2dyYW0gfCB0LkZpbGUpIHtcbiAgaWYgKG5vZGUudHlwZSA9PT0gJ0ZpbGUnKSB7XG4gICAgcmV0dXJuIG5vZGUucHJvZ3JhbS5ib2R5O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBub2RlLmJvZHk7XG4gIH1cbn1cblxuLyoqXG4gKiBBbGxvd3MgeW91IHRvIGNvbnN0cnVjdCBhbiBleHByZXNzaW9uIHRoYXQgcmVsaWVzIG9uIGltcG9ydGVkIHZhbHVlcy5cbiAqL1xuY2xhc3MgRXhwcmVzc2lvbkNvbnRleHQge1xuICAjaW1wb3J0ZXI6IEltcG9ydFV0aWw7XG4gICN0YXJnZXQ6IE5vZGVQYXRoPHQuTm9kZT47XG5cbiAgY29uc3RydWN0b3IoaW1wb3J0ZXI6IEltcG9ydFV0aWwsIHRhcmdldDogTm9kZVBhdGg8dC5Ob2RlPikge1xuICAgIHRoaXMuI2ltcG9ydGVyID0gaW1wb3J0ZXI7XG4gICAgdGhpcy4jdGFyZ2V0ID0gdGFyZ2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmQgb3IgY3JlYXRlIGEgbG9jYWwgYmluZGluZyBmb3IgdGhlIGdpdmVuIGltcG9ydC5cbiAgICpcbiAgICogQHBhcmFtIG1vZHVsZVNwZWNpZmllciBUaGUgcGF0aCB0byBpbXBvcnQgZnJvbS5cbiAgICogQHBhcmFtIGV4cG9ydGVkTmFtZSBUaGUgbmFtZWQgZXhwb3J0IHlvdSB3aXNoIHRvIGFjY2Vzcywgb3IgXCJkZWZhdWx0XCIgZm9yXG4gICAqIHRoZSBkZWZhdWx0IGV4cG9ydCwgb3IgXCIqXCIgZm9yIHRoZSBuYW1lc3BhY2UgZXhwb3J0LlxuICAgKiBAcGFyYW0gbmFtZUhpbnQgT3B0aW9uYWxseSwgcHJvdmlkZSBhIGRlc2NyaXB0aXZlIG5hbWUgZm9yIHlvdXIgbmV3XG4gICAqIGJpbmRpbmcuIFdlIHdpbGwgbWFuZ2xlIHRoaXMgbmFtZSBhcyBuZWVkZWQgdG8gYXZvaWQgY29sbGlzaW9ucywgYnV0XG4gICAqIHBpY2tpbmcgYSBnb29kIG5hbWUgaGVyZSBjYW4gYWlkIGluIGRlYnVnZ2luZy5cblxuICAgKiBAcmV0dXJuIHRoZSBsb2NhbCBpZGVudGlmaWVyIGZvciB0aGUgaW1wb3J0ZWQgdmFsdWVcbiAgICovXG4gIGltcG9ydChtb2R1bGVTcGVjaWZpZXI6IHN0cmluZywgZXhwb3J0ZWROYW1lOiBzdHJpbmcsIG5hbWVIaW50Pzogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyB0aGlzIG1ldGhvZCBpbiBiYWJlbC1pbXBvcnQtdXRpbCBpcyB0aGUgbG93ZXItbGV2ZWwgb25lIHRoYXQgZG9lc24ndCB0cnlcbiAgICAvLyB0byBjcmVhdGUgdmFsaWQgcmVmZXJlbmNlcyBmb3IgdXMuIEl0J3Mgb3VyIHJlc3BvbnNpYmlsaXR5IHRvIGRvIHNvLiBCdXRcbiAgICAvLyB0aGF0J3MgT0sgaGVyZSwgYmVjYXVzZSB3ZSBoYXZlIHRoZSBzYW1lIHJlc3BvbnNpYmlsaXR5IGZvciBldmVyeVxuICAgIC8vIHNjb3BlLWJhZyBpZGVudGlmaWVyLCBub3QganVzdCB0aGUgaW1wb3J0ZWQgb25lcywgYW5kIGl0IHdpbGwgYmUgZWFzaWVyXG4gICAgLy8gdG8gaGFuZGxlIHRoZW0gYWxsIGF0IG9uY2UuXG4gICAgcmV0dXJuIHRoaXMuI2ltcG9ydGVyLmltcG9ydCh0aGlzLiN0YXJnZXQsIG1vZHVsZVNwZWNpZmllciwgZXhwb3J0ZWROYW1lLCBuYW1lSGludCkubmFtZTtcbiAgfVxufVxuXG4vKipcbiAqIFlvdSBjYW4gcGFzcyBhIEphdmFzY3JpcHQgZXhwcmVzc2lvbiBhcyBhIHN0cmluZyBsaWtlOlxuICpcbiAqICAgXCJuZXcgRGF0ZSgpXCJcbiAqXG4gKiBPciBhcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHN0cmluZzpcbiAqXG4gKiAgICgpID0+IFwibmV3IERhdGUoKVwiXG4gKlxuICogV2hlbiB5b3UgdXNlIGEgZnVuY3Rpb24sIGl0IGNhbiB1c2UgaW1wb3J0ZWQgdmFsdWVzOlxuICpcbiAqICAgKGNvbnRleHQpID0+IGBuZXcgJHtjb250ZXh0LmltcG9ydChcImx1eG9uXCIsIFwiRGF0ZVRpbWVcIil9KClgXG4gKlxuICovXG5leHBvcnQgdHlwZSBFeHByZXNzaW9uID0gc3RyaW5nIHwgKChjb250ZXh0OiBFeHByZXNzaW9uQ29udGV4dCkgPT4gc3RyaW5nKTtcbiJdfQ==