"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePlugin = makePlugin;
const babel_import_util_1 = require("babel-import-util");
const expression_parser_1 = require("./expression-parser");
const js_utils_1 = require("./js-utils");
const scope_locals_1 = require("./scope-locals");
const syntax_1 = require("@glimmer/syntax");
__exportStar(require("./public-types"), exports);
const INLINE_PRECOMPILE_MODULES = [
    {
        moduleName: 'ember-cli-htmlbars',
        export: 'hbs',
        allowTemplateLiteral: true,
    },
    {
        moduleName: 'ember-cli-htmlbars-inline-precompile',
        export: 'default',
        allowTemplateLiteral: true,
    },
    {
        moduleName: 'htmlbars-inline-precompile',
        export: 'default',
        allowTemplateLiteral: true,
    },
    {
        moduleName: '@ember/template-compilation',
        export: 'precompileTemplate',
        enableScope: true,
    },
    {
        moduleName: '@ember/template-compiler',
        export: 'template',
        enableScope: true,
        rfc931Support: 'polyfilled',
    },
];
function normalizeOpts(options) {
    var _a;
    if (((_a = options.targetFormat) !== null && _a !== void 0 ? _a : 'wire') === 'wire') {
        let { compiler } = options;
        if (!compiler) {
            throw new Error(`when targetFormat==="wire" you must set the compiler or compilerPath option`);
        }
        return Object.assign(Object.assign({ outputModuleOverrides: {}, enableLegacyModules: [], transforms: [] }, options), { targetFormat: 'wire', compiler });
    }
    else {
        return Object.assign(Object.assign({ outputModuleOverrides: {}, enableLegacyModules: [], transforms: [] }, options), { targetFormat: 'hbs' });
    }
}
function makePlugin(loadOptions) {
    return function htmlbarsInlinePrecompile(babel) {
        let t = babel.types;
        const plugin = {
            visitor: {
                Program: {
                    enter(path, state) {
                        state.normalizedOpts = normalizeOpts(loadOptions(state.opts));
                        state.templateFactory = templateFactoryConfig(state.normalizedOpts);
                        state.util = new babel_import_util_1.ImportUtil(babel, path);
                        state.program = path;
                        state.recursionGuard = new Set();
                    },
                    exit(_path, state) {
                        if (state.normalizedOpts.targetFormat === 'wire') {
                            for (let { moduleName, export: exportName } of configuredModules(state)) {
                                state.util.removeImport(moduleName, exportName);
                            }
                        }
                    },
                },
                TaggedTemplateExpression(path, state) {
                    let tagPath = path.get('tag');
                    if (!tagPath.isIdentifier()) {
                        return;
                    }
                    let config = referencesInlineCompiler(tagPath, state);
                    if (!config) {
                        return;
                    }
                    if (!config.allowTemplateLiteral) {
                        throw path.buildCodeFrameError(`Attempted to use \`${tagPath.node.name}\` as a template tag, but it can only be called as a function with a string passed to it: ${tagPath.node.name}('content here')`);
                    }
                    if (path.node.quasi.expressions.length) {
                        throw path.buildCodeFrameError('placeholders inside a tagged template string are not supported');
                    }
                    let template = path.node.quasi.quasis.map((quasi) => quasi.value.cooked).join('');
                    if (state.normalizedOpts.targetFormat === 'wire') {
                        insertCompiledTemplate(babel, state, state.normalizedOpts, template, path, {}, config, undefined);
                    }
                    else {
                        insertTransformedTemplate(babel, state, template, path, {}, config, undefined);
                    }
                },
                CallExpression(path, state) {
                    let calleePath = path.get('callee');
                    if (!calleePath.isIdentifier()) {
                        return;
                    }
                    let config = referencesInlineCompiler(calleePath, state);
                    if (!config) {
                        return;
                    }
                    if (state.recursionGuard.has(path.node)) {
                        return;
                    }
                    if (path.get('arguments').length > 2) {
                        throw path.buildCodeFrameError(`${calleePath.node.name} can only be invoked with 2 arguments: the template string and any static options`);
                    }
                    let [firstArg, secondArg] = path.get('arguments');
                    let template;
                    switch (firstArg === null || firstArg === void 0 ? void 0 : firstArg.node.type) {
                        case 'StringLiteral':
                            template = firstArg.node.value;
                            break;
                        case 'TemplateLiteral':
                            if (firstArg.node.expressions.length) {
                                throw path.buildCodeFrameError('placeholders inside a template string are not supported');
                            }
                            else {
                                template = firstArg.node.quasis.map((quasi) => quasi.value.cooked).join('');
                            }
                            break;
                        case 'TaggedTemplateExpression':
                            throw path.buildCodeFrameError(`tagged template strings inside ${calleePath.node.name} are not supported`);
                        default:
                            throw path.buildCodeFrameError(`${calleePath.node.name} should be invoked with at least a single argument (the template string)`);
                    }
                    let userTypedOptions;
                    let backingClass;
                    if (!secondArg) {
                        userTypedOptions = {};
                    }
                    else {
                        if (!secondArg.isObjectExpression()) {
                            throw path.buildCodeFrameError(`${calleePath.node.name} can only be invoked with 2 arguments: the template string, and any static options`);
                        }
                        userTypedOptions = new expression_parser_1.ExpressionParser(babel).parseObjectExpression(calleePath.node.name, secondArg, config.enableScope, Boolean(config.rfc931Support));
                        if (config.rfc931Support && userTypedOptions.component) {
                            backingClass = userTypedOptions.component;
                        }
                    }
                    if (state.normalizedOpts.targetFormat === 'wire') {
                        insertCompiledTemplate(babel, state, state.normalizedOpts, template, path, userTypedOptions, config, backingClass);
                    }
                    else {
                        insertTransformedTemplate(babel, state, template, path, userTypedOptions, config, backingClass);
                    }
                },
            },
        };
        return {
            pre(file) {
                // run our processing in pre so that imports for gts
                // are kept for other plugins.
                babel.traverse(file.ast, plugin.visitor, file.scope, this);
            },
            visitor: {},
        };
    };
}
function* configuredModules(state) {
    for (let moduleConfig of INLINE_PRECOMPILE_MODULES) {
        if (moduleConfig.moduleName !== '@ember/template-compilation' &&
            moduleConfig.moduleName !== '@ember/template-compiler' &&
            !state.normalizedOpts.enableLegacyModules.includes(moduleConfig.moduleName)) {
            continue;
        }
        yield moduleConfig;
    }
}
function referencesInlineCompiler(path, state) {
    for (let moduleConfig of configuredModules(state)) {
        if (path.referencesImport(moduleConfig.moduleName, moduleConfig.export)) {
            return moduleConfig;
        }
    }
    return undefined;
}
function runtimeErrorIIFE(babel, replacements) {
    let statement = babel.template(`(function() {\n  throw new Error('ERROR_MESSAGE');\n})();`)(replacements);
    return statement.expression;
}
function buildScopeLocals(userTypedOptions, formatOptions, target, mayUseLexicalThis) {
    if (formatOptions.rfc931Support && userTypedOptions.eval) {
        return new scope_locals_1.ScopeLocals({ mode: 'implicit', jsPath: target, mayUseLexicalThis });
    }
    else if (userTypedOptions.scope) {
        return userTypedOptions.scope;
    }
    else {
        return new scope_locals_1.ScopeLocals({ mode: 'explicit' });
    }
}
function buildPrecompileOptions(babel, target, state, template, userTypedOptions, config, scope) {
    let jsutils = new js_utils_1.JSUtils(babel, state, target, scope.add.bind(scope), state.util);
    let meta = Object.assign({ jsutils }, userTypedOptions === null || userTypedOptions === void 0 ? void 0 : userTypedOptions.meta);
    let output = {
        contents: template,
        // we've extended meta to add jsutils, but the types in @glimmer/syntax
        // don't account for extension
        meta: meta,
        // TODO: embroider's template-compiler allows this to be overriden to get
        // backward-compatible module names that don't match the real name of the
        // on-disk file. What's our plan for migrating people away from that?
        moduleName: state.filename,
        // This is here so it's *always* the real filename. Historically, there is
        // also `moduleName` but that did not match the real on-disk filename, it
        // was the notional runtime module name from classic ember builds.
        filename: state.filename,
        plugins: {
            // the cast is needed here only because our meta is extended. That is,
            // these plugins can access meta.jsutils.
            ast: [...state.normalizedOpts.transforms, scope.crawl()],
        },
    };
    for (let [key, value] of Object.entries(userTypedOptions)) {
        if (key !== 'scope') {
            // `scope` in the user-facing API becomes `locals` in the low-level
            // ember-template-compiler API
            output[key] = value;
        }
    }
    output.locals = scope.locals;
    if (config.rfc931Support) {
        output.strictMode = true;
    }
    return output;
}
function remapAndBindIdentifiers(target, babel, scopeLocals) {
    target.traverse({
        Identifier(path) {
            var _a;
            if (scopeLocals.has(path.node.name) && path.node.name !== scopeLocals.get(path.node.name)) {
                // this identifier has different names in hbs vs js, so we need to
                // replace the hbs name in the template compiler output with the js
                // name
                path.replaceWith(babel.types.identifier(scopeLocals.get(path.node.name)));
            }
            // this is where we tell babel's scope system about the new reference we
            // just introduced. @babel/plugin-transform-typescript in particular
            // cares a lot about those references being present.
            (_a = path.scope.getBinding(path.node.name)) === null || _a === void 0 ? void 0 : _a.reference(path);
        },
    });
}
function insertCompiledTemplate(babel, state, opts, template, target, userTypedOptions, config, backingClass) {
    let t = babel.types;
    let scopeLocals = buildScopeLocals(userTypedOptions, config, target, !backingClass);
    let options = buildPrecompileOptions(babel, target, state, template, userTypedOptions, config, scopeLocals);
    let precompileResultString;
    // insertRuntimeErrors is legacy and not supported by the newer rfc931 form
    if (options.insertRuntimeErrors && !config.rfc931Support) {
        try {
            precompileResultString = opts.compiler.precompile(template, options);
        }
        catch (error) {
            target.replaceWith(runtimeErrorIIFE(babel, { ERROR_MESSAGE: error.message }));
            return;
        }
    }
    else {
        precompileResultString = opts.compiler.precompile(template, options);
    }
    let templateExpression = babel.template.expression.ast(precompileResultString);
    t.addComment(templateExpression, 'leading', `\n  ${template.replace(/\*\//g, '*\\/')}\n`, 
    /* line comment? */ false);
    state.util.replaceWith(target, (i) => {
        var _a;
        let templateFactoryIdentifier = i.import(state.templateFactory.moduleName, state.templateFactory.exportName);
        let expression = t.callExpression(templateFactoryIdentifier, [templateExpression]);
        if (config.rfc931Support) {
            expression = t.callExpression(i.import('@ember/component', 'setComponentTemplate'), [
                expression,
                (_a = backingClass === null || backingClass === void 0 ? void 0 : backingClass.node) !== null && _a !== void 0 ? _a : t.callExpression(i.import('@ember/component/template-only', 'default', 'templateOnly'), []),
            ]);
        }
        return expression;
    });
    remapAndBindIdentifiers(target, babel, scopeLocals);
}
function insertTransformedTemplate(babel, state, template, target, userTypedOptions, formatOptions, backingClass) {
    let t = babel.types;
    let scopeLocals = buildScopeLocals(userTypedOptions, formatOptions, target, !backingClass);
    let options = buildPrecompileOptions(babel, target, state, template, userTypedOptions, formatOptions, scopeLocals);
    let ast = (0, syntax_1.preprocess)(template, Object.assign(Object.assign({}, options), { mode: 'codemod' }));
    let transformed = (0, syntax_1.print)(ast, { entityEncoding: 'raw' });
    if (target.isCallExpression()) {
        updateCallForm(target, transformed, formatOptions, scopeLocals, state, babel, backingClass);
    }
    else {
        updateBacktickForm(scopeLocals, state, target, t, transformed, babel);
    }
}
function updateBacktickForm(scopeLocals, state, target, t, transformed, babel) {
    if (scopeLocals.isEmpty()) {
        // simple case: just replace the string literal part with the transformed
        // template contents
        target.get('quasi').get('quasis.0').replaceWith(t.templateElement({ raw: transformed }));
        return;
    }
    // need to add scope, so need to replace the backticks form with a call
    // expression to precompileTemplate
    maybePruneImport(state.util, target.get('tag'));
    let newCall = state.util.replaceWith(target, (i) => t.callExpression(precompileTemplate(i), [t.stringLiteral(transformed)]));
    updateScope(babel, newCall, scopeLocals);
}
function updateCallForm(target, transformed, formatOptions, scopeLocals, state, babel, backingClass) {
    // first the simple part: replacing the string literal with the actual body of
    // the rewritten template
    target.get('arguments.0').replaceWith(babel.types.stringLiteral(transformed));
    if (!formatOptions.enableScope && !scopeLocals.isEmpty()) {
        // an AST transform added lexically scoped values to a template that
        // wasn't already in a form that supports them, so convert form.
        maybePruneImport(state.util, target.get('callee'));
        state.util.replaceWith(target.get('callee'), (i) => precompileTemplate(i));
    }
    if (formatOptions.rfc931Support === 'polyfilled') {
        maybePruneImport(state.util, target.get('callee'));
        state.util.replaceWith(target.get('callee'), (i) => precompileTemplate(i));
        convertStrictMode(babel, target);
        removeEvalAndScope(target);
        target.node.arguments = target.node.arguments.slice(0, 2);
        state.recursionGuard.add(target.node);
        state.util.replaceWith(target, (i) => {
            var _a;
            return babel.types.callExpression(i.import('@ember/component', 'setComponentTemplate'), [
                target.node,
                (_a = backingClass === null || backingClass === void 0 ? void 0 : backingClass.node) !== null && _a !== void 0 ? _a : babel.types.callExpression(i.import('@ember/component/template-only', 'default', 'templateOnly'), []),
            ]);
        });
        // we just wrapped the target callExpression in the call to
        // setComponentTemplate. Adjust `target` back to point at the
        // precompileTemplate call for the final updateScope below.
        //
        target = target.get('arguments.0');
    }
    // We deliberately do updateScope at the end so that when it updates
    // references, those references will point to the accurate paths in the
    // final AST.
    updateScope(babel, target, scopeLocals);
}
function templateFactoryConfig(opts) {
    var _a;
    let moduleName = '@ember/template-factory';
    let exportName = 'createTemplateFactory';
    let overrides = (_a = opts.outputModuleOverrides[moduleName]) === null || _a === void 0 ? void 0 : _a[exportName];
    return overrides
        ? { exportName: overrides[0], moduleName: overrides[1] }
        : { exportName, moduleName };
}
function buildScope(babel, locals) {
    let t = babel.types;
    return t.arrowFunctionExpression([], t.objectExpression(locals
        .entries()
        .map(([name, identifier]) => t.objectProperty(t.identifier(name), t.identifier(identifier), false, name !== 'this'))));
}
// this is responsible both for adjusting the AST for our scope argument *and*
// ensuring that babel's scope system will see that these new identifiers
// reference their bindings. @babel/plugin-transform-typescript in particular
// cares an awful lot about whether an import has valid non-type references, so
// these newly introducd references need to be valid.
function updateScope(babel, target, locals) {
    let t = babel.types;
    let secondArg = target.get('arguments.1');
    if (secondArg) {
        let scope = secondArg.get('properties').find((p) => {
            let key = p.get('key');
            return key.isIdentifier() && key.node.name === 'scope';
        });
        if (scope) {
            if (locals.isEmpty()) {
                scope.remove();
            }
            else {
                scope.set('value', buildScope(babel, locals));
                // funny-looking naming here, but it actually makes sense because we're
                // connecting the glimmer scope system with the babel scope system.
                scope.scope.crawl();
            }
        }
        else if (!locals.isEmpty()) {
            secondArg.pushContainer('properties', t.objectProperty(t.identifier('scope'), buildScope(babel, locals)));
            secondArg.get(`properties.${secondArg.node.properties.length - 1}`).scope.crawl();
        }
    }
    else if (!locals.isEmpty()) {
        target.pushContainer('arguments', t.objectExpression([t.objectProperty(t.identifier('scope'), buildScope(babel, locals))]));
        target.get('arguments.1').scope.crawl();
    }
}
function removeEvalAndScope(target) {
    let secondArg = target.get('arguments.1');
    if (secondArg) {
        let evalProp = secondArg.get('properties').find((p) => {
            let key = p.get('key');
            return key.isIdentifier() && key.node.name === 'eval';
        });
        if (evalProp) {
            evalProp.remove();
        }
        let componentProp = secondArg.get('properties').find((p) => {
            let key = p.get('key');
            return key.isIdentifier() && key.node.name === 'component';
        });
        if (componentProp) {
            componentProp.remove();
        }
    }
}
// Given a call to template(), convert its "strict" argument into
// precompileTemplate's "strictMode" argument. They differ in name and default
// value.
function convertStrictMode(babel, target) {
    let t = babel.types;
    let secondArg = target.get('arguments.1');
    if (secondArg) {
        let strict = secondArg.get('properties').find((p) => {
            let key = p.get('key');
            return key.isIdentifier() && key.node.name === 'strict';
        });
        if (strict) {
            strict.set('key', t.identifier('strictMode'));
        }
        else {
            secondArg.pushContainer('properties', t.objectProperty(t.identifier('strictMode'), t.booleanLiteral(true)));
        }
    }
    else {
        target.pushContainer('arguments', t.objectExpression([t.objectProperty(t.identifier('strictMode'), t.booleanLiteral(true))]));
    }
}
function maybePruneImport(util, identifier) {
    if (!identifier.isIdentifier()) {
        return;
    }
    let binding = identifier.scope.getBinding(identifier.node.name);
    if (!binding) {
        return;
    }
    let found = binding.referencePaths.find((path) => path.node === identifier.node);
    if (!found) {
        return;
    }
    binding.referencePaths.splice(binding.referencePaths.indexOf(found), 1);
    binding.references--;
    if (binding.references === 0) {
        let specifier = binding.path;
        if (specifier.isImportSpecifier()) {
            let declaration = specifier.parentPath;
            util.removeImport(declaration.node.source.value, name(specifier.node.imported));
        }
    }
}
function precompileTemplate(i) {
    return i.import('@ember/template-compilation', 'precompileTemplate');
}
function name(node) {
    if (node.type === 'StringLiteral') {
        return node.value;
    }
    else {
        return node.name;
    }
}
exports.default = makePlugin((options) => options);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1SkEsZ0NBZ0xDO0FBcFVELHlEQUE4RDtBQUM5RCwyREFBdUQ7QUFDdkQseUNBQTREO0FBRzVELGlEQUE2QztBQUM3Qyw0Q0FBMkU7QUFFM0UsaURBQStCO0FBWS9CLE1BQU0seUJBQXlCLEdBQW1CO0lBQ2hEO1FBQ0UsVUFBVSxFQUFFLG9CQUFvQjtRQUNoQyxNQUFNLEVBQUUsS0FBSztRQUNiLG9CQUFvQixFQUFFLElBQUk7S0FDM0I7SUFDRDtRQUNFLFVBQVUsRUFBRSxzQ0FBc0M7UUFDbEQsTUFBTSxFQUFFLFNBQVM7UUFDakIsb0JBQW9CLEVBQUUsSUFBSTtLQUMzQjtJQUNEO1FBQ0UsVUFBVSxFQUFFLDRCQUE0QjtRQUN4QyxNQUFNLEVBQUUsU0FBUztRQUNqQixvQkFBb0IsRUFBRSxJQUFJO0tBQzNCO0lBQ0Q7UUFDRSxVQUFVLEVBQUUsNkJBQTZCO1FBQ3pDLE1BQU0sRUFBRSxvQkFBb0I7UUFDNUIsV0FBVyxFQUFFLElBQUk7S0FDbEI7SUFDRDtRQUNFLFVBQVUsRUFBRSwwQkFBMEI7UUFDdEMsTUFBTSxFQUFFLFVBQVU7UUFDbEIsV0FBVyxFQUFFLElBQUk7UUFDakIsYUFBYSxFQUFFLFlBQVk7S0FDNUI7Q0FDRixDQUFDO0FBK0RGLFNBQVMsYUFBYSxDQUFDLE9BQWdCOztJQUNyQyxJQUFJLENBQUMsTUFBQSxPQUFPLENBQUMsWUFBWSxtQ0FBSSxNQUFNLENBQUMsS0FBSyxNQUFNLEVBQUUsQ0FBQztRQUNoRCxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFDO1FBQzNCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNkLE1BQU0sSUFBSSxLQUFLLENBQ2IsNkVBQTZFLENBQzlFLENBQUM7UUFDSixDQUFDO1FBQ0QscUNBQ0UscUJBQXFCLEVBQUUsRUFBRSxFQUN6Qixt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QUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3hFLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUVyQixJQUFJLE9BQU8sQ0FBQyxVQUFVLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDN0IsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztRQUM3QixJQUFJLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQUM7WUFDbEMsSUFBSSxXQUFXLEdBQUcsU0FBUyxDQUFDLFVBQTJDLENBQUM7WUFDeEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNsRixDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLENBQVc7SUFDckMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLG9CQUFvQixDQUFDLENBQUM7QUFDdkUsQ0FBQztBQUVELFNBQVMsSUFBSSxDQUFDLElBQW9DO0lBQ2hELElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxlQUFlLEVBQUUsQ0FBQztRQUNsQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztTQUFNLENBQUM7UUFDTixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDbkIsQ0FBQztBQUNILENBQUM7QUFFRCxrQkFBZSxVQUFVLENBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBOb2RlUGF0aCB9IGZyb20gJ0BiYWJlbC90cmF2ZXJzZSc7XG5pbXBvcnQgdHlwZSAqIGFzIEJhYmVsIGZyb20gJ0BiYWJlbC9jb3JlJztcbmltcG9ydCB0eXBlIHsgdHlwZXMgYXMgdCB9IGZyb20gJ0BiYWJlbC9jb3JlJztcbmltcG9ydCB7IEltcG9ydFV0aWwsIHR5cGUgSW1wb3J0ZXIgfSBmcm9tICdiYWJlbC1pbXBvcnQtdXRpbCc7XG5pbXBvcnQgeyBFeHByZXNzaW9uUGFyc2VyIH0gZnJvbSAnLi9leHByZXNzaW9uLXBhcnNlcic7XG5pbXBvcnQgeyBKU1V0aWxzLCBFeHRlbmRlZFBsdWdpbkJ1aWxkZXIgfSBmcm9tICcuL2pzLXV0aWxzJztcbmltcG9ydCB0eXBlIHsgRW1iZXJUZW1wbGF0ZUNvbXBpbGVyLCBQcmVwcm9jZXNzT3B0aW9ucyB9IGZyb20gJy4vZW1iZXItdGVtcGxhdGUtY29tcGlsZXInO1xuaW1wb3J0IHsgTGVnYWN5TW9kdWxlTmFtZSB9IGZyb20gJy4vcHVibGljLXR5cGVzJztcbmltcG9ydCB7IFNjb3BlTG9jYWxzIH0gZnJvbSAnLi9zY29wZS1sb2NhbHMnO1xuaW1wb3J0IHsgdHlwZSBBU1RQbHVnaW5CdWlsZGVyLCBwcmVwcm9jZXNzLCBwcmludCB9IGZyb20gJ0BnbGltbWVyL3N5bnRheCc7XG5cbmV4cG9ydCAqIGZyb20gJy4vcHVibGljLXR5cGVzJztcblxudHlwZSBNb2R1bGVOYW1lID0gTGVnYWN5TW9kdWxlTmFtZSB8ICdAZW1iZXIvdGVtcGxhdGUtY29tcGlsYXRpb24nIHwgJ0BlbWJlci90ZW1wbGF0ZS1jb21waWxlcic7XG5cbmludGVyZmFjZSBNb2R1bGVDb25maWcge1xuICBtb2R1bGVOYW1lOiBNb2R1bGVOYW1lO1xuICBleHBvcnQ6IHN0cmluZztcbiAgYWxsb3dUZW1wbGF0ZUxpdGVyYWw/OiB0cnVlO1xuICBlbmFibGVTY29wZT86IHRydWU7XG4gIHJmYzkzMVN1cHBvcnQ/OiAncG9seWZpbGxlZCc7XG59XG5cbmNvbnN0IElOTElORV9QUkVDT01QSUxFX01PRFVMRVM6IE1vZHVsZUNvbmZpZ1tdID0gW1xuICB7XG4gICAgbW9kdWxlTmFtZTogJ2VtYmVyLWNsaS1odG1sYmFycycsXG4gICAgZXhwb3J0OiAnaGJzJyxcbiAgICBhbGxvd1RlbXBsYXRlTGl0ZXJhbDogdHJ1ZSxcbiAgfSxcbiAge1xuICAgIG1vZHVsZU5hbWU6ICdlbWJlci1jbGktaHRtbGJhcnMtaW5saW5lLXByZWNvbXBpbGUnLFxuICAgIGV4cG9ydDogJ2RlZmF1bHQnLFxuICAgIGFsbG93VGVtcGxhdGVMaXRlcmFsOiB0cnVlLFxuICB9LFxuICB7XG4gICAgbW9kdWxlTmFtZTogJ2h0bWxiYXJzLWlubGluZS1wcmVjb21waWxlJyxcbiAgICBleHBvcnQ6ICdkZWZhdWx0JyxcbiAgICBhbGxvd1RlbXBsYXRlTGl0ZXJhbDogdHJ1ZSxcbiAgfSxcbiAge1xuICAgIG1vZHVsZU5hbWU6ICdAZW1iZXIvdGVtcGxhdGUtY29tcGlsYXRpb24nLFxuICAgIGV4cG9ydDogJ3ByZWNvbXBpbGVUZW1wbGF0ZScsXG4gICAgZW5hYmxlU2NvcGU6IHRydWUsXG4gIH0sXG4gIHtcbiAgICBtb2R1bGVOYW1lOiAnQGVtYmVyL3RlbXBsYXRlLWNvbXBpbGVyJyxcbiAgICBleHBvcnQ6ICd0ZW1wbGF0ZScsXG4gICAgZW5hYmxlU2NvcGU6IHRydWUsXG4gICAgcmZjOTMxU3VwcG9ydDogJ3BvbHlmaWxsZWQnLFxuICB9LFxuXTtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgLy8gVGhlIGVtYmVyLXRlbXBsYXRlLWNvbXBpbGVyLmpzIG1vZHVsZSB0aGF0IHNoaXBzIHdpdGhpbiB5b3VyIGVtYmVyLXNvdXJjZVxuICAvLyB2ZXJzaW9uLiBNYW5kYXRvcnkgd2hlbiB1c2luZyB0YXJnZXRGb3JtYXQ6ICd3aXJlJy5cbiAgY29tcGlsZXI/OiBFbWJlclRlbXBsYXRlQ29tcGlsZXI7XG5cbiAgLy8gQWxsb3dzIHlvdSB0byByZW1hcCB3aGF0IGltcG9ydHMgd2lsbCBiZSBlbWl0dGVkIGluIG91ciBjb21waWxlZCBvdXRwdXQuIEJ5XG4gIC8vIGV4YW1wbGU6XG4gIC8vXG4gIC8vICAgb3V0cHV0TW9kdWxlT3ZlcnJpZGVzOiB7XG4gIC8vICAgICAnQGVtYmVyL3RlbXBsYXRlLWZhY3RvcnknOiB7XG4gIC8vICAgICAgIGNyZWF0ZVRlbXBsYXRlRmFjdG9yeTogWydjcmVhdGVUZW1wbGF0ZUZhY3RvcnknLCAnQGdsaW1tZXIvY29yZSddLFxuICAvLyAgICAgfVxuICAvLyAgIH1cbiAgLy9cbiAgLy8gTm9ybWFsIEVtYmVyIGFwcHMgc2hvdWxkbid0IG5lZWQgdGhpcywgaXQgZXhpc3RzIHRvIHN1cHBvcnQgb3RoZXJcbiAgLy8gZW52aXJvbm1lbnRzIGxpa2Ugc3RhbmRhbG9uZSBHbGltbWVySlNcbiAgb3V0cHV0TW9kdWxlT3ZlcnJpZGVzPzogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgW3N0cmluZywgc3RyaW5nXT4+O1xuXG4gIC8vIEJ5IGRlZmF1bHQsIHRoaXMgcGx1Z2luIGltcGxlbWVudHMgb25seSBFbWJlcidzIHN0YWJsZSBwdWJsaWMgQVBJIGZvclxuICAvLyB0ZW1wbGF0ZSBjb21waWxhdGlvbiwgd2hpY2ggaXM6XG4gIC8vXG4gIC8vICAgIGltcG9ydCB7IHByZWNvbXBpbGVUZW1wbGF0ZSB9IGZyb20gJ0BlbWJlci90ZW1wbGF0ZS1jb21waWxhdGlvbic7XG4gIC8vXG4gIC8vIEJ1dCBoaXN0b3JpY2FsbHkgdGhlcmUgYXJlIHNldmVyYWwgb3RoZXIgaW1wb3J0YWJsZSBzeW50YXhlcyBpbiB3aWRlc3ByZWFkXG4gIC8vIHVzZSwgYW5kIHdlIGNhbiBlbmFibGUgdGhvc2UgdG9vIGJ5IGluY2x1ZGluZyB0aGVpciBtb2R1bGUgbmFtZXMgaW4gdGhpc1xuICAvLyBsaXN0LlxuICBlbmFibGVMZWdhY3lNb2R1bGVzPzogTGVnYWN5TW9kdWxlTmFtZVtdO1xuXG4gIC8vIENvbnRyb2xzIHRoZSBvdXRwdXQgZm9ybWF0LlxuICAvL1xuICAvLyAgXCJ3aXJlXCI6IFRoZSBkZWZhdWx0LiBJbiB0aGUgb3V0cHV0LCB5b3VyIHRlbXBsYXRlcyBhcmUgcmVhZHkgdG8gZXhlY3V0ZSBpblxuICAvLyAgdGhlIG1vc3QgcGVyZm9ybWFudCB3YXkuXG4gIC8vXG4gIC8vICBcImhic1wiOiBJbiB0aGUgb3V0cHV0LCB5b3VyIHRlbXBsYXRlcyB3aWxsIHN0aWxsIGJlIGluIEhCUyBmb3JtYXQuXG4gIC8vICBHZW5lcmFsbHkgdGhpcyBtZWFucyB0aGV5IHdpbGwgc3RpbGwgbmVlZCBmdXJ0aGVyIHByb2Nlc3NpbmcgYmVmb3JlXG4gIC8vICB0aGV5J3JlIHJlYWR5IHRvIGV4ZWN1dGUuIFRoZSBwdXJwb3NlIG9mIHRoaXMgbW9kZSBpcyB0byBzdXBwb3J0IHRoaW5nc1xuICAvLyAgbGlrZSBjb2RlbW9kcyBhbmQgcHJlLXB1YmxpY2F0aW9uIHRyYW5zZm9ybWF0aW9ucyBpbiBsaWJyYXJpZXMuXG4gIHRhcmdldEZvcm1hdD86ICd3aXJlJyB8ICdoYnMnO1xuXG4gIC8vIE9wdGlvbmFsIGxpc3Qgb2YgY3VzdG9tIHRyYW5zZm9ybXMgdG8gYXBwbHkgdG8gdGhlIGhhbmRsZWJhcnMgQVNUIGJlZm9yZVxuICAvLyBjb21waWxhdGlvbi5cbiAgdHJhbnNmb3Jtcz86IEV4dGVuZGVkUGx1Z2luQnVpbGRlcltdO1xufVxuXG5pbnRlcmZhY2UgV2lyZU9wdHMge1xuICB0YXJnZXRGb3JtYXQ6ICd3aXJlJztcbiAgY29tcGlsZXI6IEVtYmVyVGVtcGxhdGVDb21waWxlcjtcbiAgb3V0cHV0TW9kdWxlT3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBbc3RyaW5nLCBzdHJpbmddPj47XG4gIGVuYWJsZUxlZ2FjeU1vZHVsZXM6IExlZ2FjeU1vZHVsZU5hbWVbXTtcbiAgdHJhbnNmb3JtczogRXh0ZW5kZWRQbHVnaW5CdWlsZGVyW107XG59XG5cbmludGVyZmFjZSBIYnNPcHRzIHtcbiAgdGFyZ2V0Rm9ybWF0OiAnaGJzJztcbiAgb3V0cHV0TW9kdWxlT3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBbc3RyaW5nLCBzdHJpbmddPj47XG4gIGVuYWJsZUxlZ2FjeU1vZHVsZXM6IExlZ2FjeU1vZHVsZU5hbWVbXTtcbiAgdHJhbnNmb3JtczogRXh0ZW5kZWRQbHVnaW5CdWlsZGVyW107XG59XG5cbnR5cGUgTm9ybWFsaXplZE9wdHMgPSBXaXJlT3B0cyB8IEhic09wdHM7XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU9wdHMob3B0aW9uczogT3B0aW9ucyk6IE5vcm1hbGl6ZWRPcHRzIHtcbiAgaWYgKChvcHRpb25zLnRhcmdldEZvcm1hdCA/PyAnd2lyZScpID09PSAnd2lyZScpIHtcbiAgICBsZXQgeyBjb21waWxlciB9ID0gb3B0aW9ucztcbiAgICBpZiAoIWNvbXBpbGVyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGB3aGVuIHRhcmdldEZvcm1hdD09PVwid2lyZVwiIHlvdSBtdXN0IHNldCB0aGUgY29tcGlsZXIgb3IgY29tcGlsZXJQYXRoIG9wdGlvbmBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBvdXRwdXRNb2R1bGVPdmVycmlkZXM6IHt9LFxuICAgICAgZW5hYmxlTGVnYWN5TW9kdWxlczogW10sXG4gICAgICB0cmFuc2Zvcm1zOiBbXSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICB0YXJnZXRGb3JtYXQ6ICd3aXJlJyxcbiAgICAgIGNvbXBpbGVyLFxuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG91dHB1dE1vZHVsZU92ZXJyaWRlczoge30sXG4gICAgICBlbmFibGVMZWdhY3lNb2R1bGVzOiBbXSxcbiAgICAgIHRyYW5zZm9ybXM6IFtdLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIHRhcmdldEZvcm1hdDogJ2hicycsXG4gICAgfTtcbiAgfVxufVxuXG5pbnRlcmZhY2UgU3RhdGU8RW52U3BlY2lmaWNPcHRpb25zPiB7XG4gIG9wdHM6IEVudlNwZWNpZmljT3B0aW9ucztcbiAgbm9ybWFsaXplZE9wdHM6IE5vcm1hbGl6ZWRPcHRzO1xuICB1dGlsOiBJbXBvcnRVdGlsO1xuICB0ZW1wbGF0ZUZhY3Rvcnk6IHsgbW9kdWxlTmFtZTogc3RyaW5nOyBleHBvcnROYW1lOiBzdHJpbmcgfTtcbiAgcHJvZ3JhbTogTm9kZVBhdGg8dC5Qcm9ncmFtPjtcbiAgbGFzdEluc2VydGVkUGF0aDogTm9kZVBhdGg8dC5TdGF0ZW1lbnQ+IHwgdW5kZWZpbmVkO1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICByZWN1cnNpb25HdWFyZDogU2V0PHVua25vd24+O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZVBsdWdpbjxFbnZTcGVjaWZpY09wdGlvbnM+KGxvYWRPcHRpb25zOiAob3B0czogRW52U3BlY2lmaWNPcHRpb25zKSA9PiBPcHRpb25zKSB7XG4gIHJldHVybiBmdW5jdGlvbiBodG1sYmFyc0lubGluZVByZWNvbXBpbGUoXG4gICAgYmFiZWw6IHR5cGVvZiBCYWJlbFxuICApOiBCYWJlbC5QbHVnaW5PYmo8U3RhdGU8RW52U3BlY2lmaWNPcHRpb25zPj4ge1xuICAgIGxldCB0ID0gYmFiZWwudHlwZXM7XG5cbiAgICBjb25zdCBwbHVnaW4gPSB7XG4gICAgICB2aXNpdG9yOiB7XG4gICAgICAgIFByb2dyYW06IHtcbiAgICAgICAgICBlbnRlcihwYXRoOiBOb2RlUGF0aDx0LlByb2dyYW0+LCBzdGF0ZTogU3RhdGU8RW52U3BlY2lmaWNPcHRpb25zPikge1xuICAgICAgICAgICAgc3RhdGUubm9ybWFsaXplZE9wdHMgPSBub3JtYWxpemVPcHRzKGxvYWRPcHRpb25zKHN0YXRlLm9wdHMpKTtcbiAgICAgICAgICAgIHN0YXRlLnRlbXBsYXRlRmFjdG9yeSA9IHRlbXBsYXRlRmFjdG9yeUNvbmZpZyhzdGF0ZS5ub3JtYWxpemVkT3B0cyk7XG4gICAgICAgICAgICBzdGF0ZS51dGlsID0gbmV3IEltcG9ydFV0aWwoYmFiZWwsIHBhdGgpO1xuICAgICAgICAgICAgc3RhdGUucHJvZ3JhbSA9IHBhdGg7XG4gICAgICAgICAgICBzdGF0ZS5yZWN1cnNpb25HdWFyZCA9IG5ldyBTZXQoKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGV4aXQoX3BhdGg6IE5vZGVQYXRoPHQuUHJvZ3JhbT4sIHN0YXRlOiBTdGF0ZTxFbnZTcGVjaWZpY09wdGlvbnM+KSB7XG4gICAgICAgICAgICBpZiAoc3RhdGUubm9ybWFsaXplZE9wdHMudGFyZ2V0Rm9ybWF0ID09PSAnd2lyZScpIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgeyBtb2R1bGVOYW1lLCBleHBvcnQ6IGV4cG9ydE5hbWUgfSBvZiBjb25maWd1cmVkTW9kdWxlcyhzdGF0ZSkpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS51dGlsLnJlbW92ZUltcG9ydChtb2R1bGVOYW1lLCBleHBvcnROYW1lKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG5cbiAgICAgICAgVGFnZ2VkVGVtcGxhdGVFeHByZXNzaW9uKFxuICAgICAgICAgIHBhdGg6IE5vZGVQYXRoPHQuVGFnZ2VkVGVtcGxhdGVFeHByZXNzaW9uPixcbiAgICAgICAgICBzdGF0ZTogU3RhdGU8RW52U3BlY2lmaWNPcHRpb25zPlxuICAgICAgICApIHtcbiAgICAgICAgICBsZXQgdGFnUGF0aCA9IHBhdGguZ2V0KCd0YWcnKTtcblxuICAgICAgICAgIGlmICghdGFnUGF0aC5pc0lkZW50aWZpZXIoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQgY29uZmlnID0gcmVmZXJlbmNlc0lubGluZUNvbXBpbGVyKHRhZ1BhdGgsIHN0YXRlKTtcbiAgICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghY29uZmlnLmFsbG93VGVtcGxhdGVMaXRlcmFsKSB7XG4gICAgICAgICAgICB0aHJvdyBwYXRoLmJ1aWxkQ29kZUZyYW1lRXJyb3IoXG4gICAgICAgICAgICAgIGBBdHRlbXB0ZWQgdG8gdXNlIFxcYCR7dGFnUGF0aC5ub2RlLm5hbWV9XFxgIGFzIGEgdGVtcGxhdGUgdGFnLCBidXQgaXQgY2FuIG9ubHkgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24gd2l0aCBhIHN0cmluZyBwYXNzZWQgdG8gaXQ6ICR7dGFnUGF0aC5ub2RlLm5hbWV9KCdjb250ZW50IGhlcmUnKWBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHBhdGgubm9kZS5xdWFzaS5leHByZXNzaW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IHBhdGguYnVpbGRDb2RlRnJhbWVFcnJvcihcbiAgICAgICAgICAgICAgJ3BsYWNlaG9sZGVycyBpbnNpZGUgYSB0YWdnZWQgdGVtcGxhdGUgc3RyaW5nIGFyZSBub3Qgc3VwcG9ydGVkJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgdGVtcGxhdGUgPSBwYXRoLm5vZGUucXVhc2kucXVhc2lzLm1hcCgocXVhc2kpID0+IHF1YXNpLnZhbHVlLmNvb2tlZCkuam9pbignJyk7XG4gICAgICAgICAgaWYgKHN0YXRlLm5vcm1hbGl6ZWRPcHRzLnRhcmdldEZvcm1hdCA9PT0gJ3dpcmUnKSB7XG4gICAgICAgICAgICBpbnNlcnRDb21waWxlZFRlbXBsYXRlKFxuICAgICAgICAgICAgICBiYWJlbCxcbiAgICAgICAgICAgICAgc3RhdGUsXG4gICAgICAgICAgICAgIHN0YXRlLm5vcm1hbGl6ZWRPcHRzLFxuICAgICAgICAgICAgICB0ZW1wbGF0ZSxcbiAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAge30sXG4gICAgICAgICAgICAgIGNvbmZpZyxcbiAgICAgICAgICAgICAgdW5kZWZpbmVkXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbnNlcnRUcmFuc2Zvcm1lZFRlbXBsYXRlKGJhYmVsLCBzdGF0ZSwgdGVtcGxhdGUsIHBhdGgsIHt9LCBjb25maWcsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIENhbGxFeHByZXNzaW9uKHBhdGg6IE5vZGVQYXRoPHQuQ2FsbEV4cHJlc3Npb24+LCBzdGF0ZTogU3RhdGU8RW52U3BlY2lmaWNPcHRpb25zPikge1xuICAgICAgICAgIGxldCBjYWxsZWVQYXRoID0gcGF0aC5nZXQoJ2NhbGxlZScpO1xuXG4gICAgICAgICAgaWYgKCFjYWxsZWVQYXRoLmlzSWRlbnRpZmllcigpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGxldCBjb25maWcgPSByZWZlcmVuY2VzSW5saW5lQ29tcGlsZXIoY2FsbGVlUGF0aCwgc3RhdGUpO1xuICAgICAgICAgIGlmICghY29uZmlnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHN0YXRlLnJlY3Vyc2lvbkd1YXJkLmhhcyhwYXRoLm5vZGUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHBhdGguZ2V0KCdhcmd1bWVudHMnKS5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICB0aHJvdyBwYXRoLmJ1aWxkQ29kZUZyYW1lRXJyb3IoXG4gICAgICAgICAgICAgIGAke2NhbGxlZVBhdGgubm9kZS5uYW1lfSBjYW4gb25seSBiZSBpbnZva2VkIHdpdGggMiBhcmd1bWVudHM6IHRoZSB0ZW1wbGF0ZSBzdHJpbmcgYW5kIGFueSBzdGF0aWMgb3B0aW9uc2BcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IFtmaXJzdEFyZywgc2Vjb25kQXJnXSA9IHBhdGguZ2V0KCdhcmd1bWVudHMnKTtcblxuICAgICAgICAgIGxldCB0ZW1wbGF0ZTtcblxuICAgICAgICAgIHN3aXRjaCAoZmlyc3RBcmc/Lm5vZGUudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnU3RyaW5nTGl0ZXJhbCc6XG4gICAgICAgICAgICAgIHRlbXBsYXRlID0gZmlyc3RBcmcubm9kZS52YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdUZW1wbGF0ZUxpdGVyYWwnOlxuICAgICAgICAgICAgICBpZiAoZmlyc3RBcmcubm9kZS5leHByZXNzaW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBwYXRoLmJ1aWxkQ29kZUZyYW1lRXJyb3IoXG4gICAgICAgICAgICAgICAgICAncGxhY2Vob2xkZXJzIGluc2lkZSBhIHRlbXBsYXRlIHN0cmluZyBhcmUgbm90IHN1cHBvcnRlZCdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlID0gZmlyc3RBcmcubm9kZS5xdWFzaXMubWFwKChxdWFzaSkgPT4gcXVhc2kudmFsdWUuY29va2VkKS5qb2luKCcnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ1RhZ2dlZFRlbXBsYXRlRXhwcmVzc2lvbic6XG4gICAgICAgICAgICAgIHRocm93IHBhdGguYnVpbGRDb2RlRnJhbWVFcnJvcihcbiAgICAgICAgICAgICAgICBgdGFnZ2VkIHRlbXBsYXRlIHN0cmluZ3MgaW5zaWRlICR7Y2FsbGVlUGF0aC5ub2RlLm5hbWV9IGFyZSBub3Qgc3VwcG9ydGVkYFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgcGF0aC5idWlsZENvZGVGcmFtZUVycm9yKFxuICAgICAgICAgICAgICAgIGAke2NhbGxlZVBhdGgubm9kZS5uYW1lfSBzaG91bGQgYmUgaW52b2tlZCB3aXRoIGF0IGxlYXN0IGEgc2luZ2xlIGFyZ3VtZW50ICh0aGUgdGVtcGxhdGUgc3RyaW5nKWBcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgdXNlclR5cGVkT3B0aW9uczogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gICAgICAgICAgbGV0IGJhY2tpbmdDbGFzczogdW5kZWZpbmVkIHwgTm9kZVBhdGg8UGFyYW1ldGVyczx0eXBlb2YgdC5jYWxsRXhwcmVzc2lvbj5bMV1bbnVtYmVyXT47XG5cbiAgICAgICAgICBpZiAoIXNlY29uZEFyZykge1xuICAgICAgICAgICAgdXNlclR5cGVkT3B0aW9ucyA9IHt9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXNlY29uZEFyZy5pc09iamVjdEV4cHJlc3Npb24oKSkge1xuICAgICAgICAgICAgICB0aHJvdyBwYXRoLmJ1aWxkQ29kZUZyYW1lRXJyb3IoXG4gICAgICAgICAgICAgICAgYCR7Y2FsbGVlUGF0aC5ub2RlLm5hbWV9IGNhbiBvbmx5IGJlIGludm9rZWQgd2l0aCAyIGFyZ3VtZW50czogdGhlIHRlbXBsYXRlIHN0cmluZywgYW5kIGFueSBzdGF0aWMgb3B0aW9uc2BcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdXNlclR5cGVkT3B0aW9ucyA9IG5ldyBFeHByZXNzaW9uUGFyc2VyKGJhYmVsKS5wYXJzZU9iamVjdEV4cHJlc3Npb24oXG4gICAgICAgICAgICAgIGNhbGxlZVBhdGgubm9kZS5uYW1lLFxuICAgICAgICAgICAgICBzZWNvbmRBcmcsXG4gICAgICAgICAgICAgIGNvbmZpZy5lbmFibGVTY29wZSxcbiAgICAgICAgICAgICAgQm9vbGVhbihjb25maWcucmZjOTMxU3VwcG9ydClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoY29uZmlnLnJmYzkzMVN1cHBvcnQgJiYgdXNlclR5cGVkT3B0aW9ucy5jb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgYmFja2luZ0NsYXNzID0gdXNlclR5cGVkT3B0aW9ucy5jb21wb25lbnQgYXMgTm9kZVBhdGg8XG4gICAgICAgICAgICAgICAgUGFyYW1ldGVyczx0eXBlb2YgdC5jYWxsRXhwcmVzc2lvbj5bMV1bbnVtYmVyXVxuICAgICAgICAgICAgICA+O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzdGF0ZS5ub3JtYWxpemVkT3B0cy50YXJnZXRGb3JtYXQgPT09ICd3aXJlJykge1xuICAgICAgICAgICAgaW5zZXJ0Q29tcGlsZWRUZW1wbGF0ZShcbiAgICAgICAgICAgICAgYmFiZWwsXG4gICAgICAgICAgICAgIHN0YXRlLFxuICAgICAgICAgICAgICBzdGF0ZS5ub3JtYWxpemVkT3B0cyxcbiAgICAgICAgICAgICAgdGVtcGxhdGUsXG4gICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgIHVzZXJUeXBlZE9wdGlvbnMsXG4gICAgICAgICAgICAgIGNvbmZpZyxcbiAgICAgICAgICAgICAgYmFja2luZ0NsYXNzXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbnNlcnRUcmFuc2Zvcm1lZFRlbXBsYXRlKFxuICAgICAgICAgICAgICBiYWJlbCxcbiAgICAgICAgICAgICAgc3RhdGUsXG4gICAgICAgICAgICAgIHRlbXBsYXRlLFxuICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICB1c2VyVHlwZWRPcHRpb25zLFxuICAgICAgICAgICAgICBjb25maWcsXG4gICAgICAgICAgICAgIGJhY2tpbmdDbGFzc1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgcHJlKHRoaXM6IFN0YXRlPEVudlNwZWNpZmljT3B0aW9ucz4sIGZpbGUpIHtcbiAgICAgICAgLy8gcnVuIG91ciBwcm9jZXNzaW5nIGluIHByZSBzbyB0aGF0IGltcG9ydHMgZm9yIGd0c1xuICAgICAgICAvLyBhcmUga2VwdCBmb3Igb3RoZXIgcGx1Z2lucy5cbiAgICAgICAgYmFiZWwudHJhdmVyc2UoZmlsZS5hc3QsIHBsdWdpbi52aXNpdG9yLCBmaWxlLnNjb3BlLCB0aGlzKTtcbiAgICAgIH0sXG4gICAgICB2aXNpdG9yOiB7fSxcbiAgICB9O1xuICB9IGFzIChiYWJlbDogdHlwZW9mIEJhYmVsKSA9PiBCYWJlbC5QbHVnaW5PYmo8dW5rbm93bj47XG59XG5cbmZ1bmN0aW9uKiBjb25maWd1cmVkTW9kdWxlczxFbnZTcGVjaWZpY09wdGlvbnM+KHN0YXRlOiBTdGF0ZTxFbnZTcGVjaWZpY09wdGlvbnM+KSB7XG4gIGZvciAobGV0IG1vZHVsZUNvbmZpZyBvZiBJTkxJTkVfUFJFQ09NUElMRV9NT0RVTEVTKSB7XG4gICAgaWYgKFxuICAgICAgbW9kdWxlQ29uZmlnLm1vZHVsZU5hbWUgIT09ICdAZW1iZXIvdGVtcGxhdGUtY29tcGlsYXRpb24nICYmXG4gICAgICBtb2R1bGVDb25maWcubW9kdWxlTmFtZSAhPT0gJ0BlbWJlci90ZW1wbGF0ZS1jb21waWxlcicgJiZcbiAgICAgICFzdGF0ZS5ub3JtYWxpemVkT3B0cy5lbmFibGVMZWdhY3lNb2R1bGVzLmluY2x1ZGVzKG1vZHVsZUNvbmZpZy5tb2R1bGVOYW1lKVxuICAgICkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHlpZWxkIG1vZHVsZUNvbmZpZztcbiAgfVxufVxuXG5mdW5jdGlvbiByZWZlcmVuY2VzSW5saW5lQ29tcGlsZXI8RW52U3BlY2lmaWNPcHRpb25zPihcbiAgcGF0aDogTm9kZVBhdGg8dC5JZGVudGlmaWVyPixcbiAgc3RhdGU6IFN0YXRlPEVudlNwZWNpZmljT3B0aW9ucz5cbik6IE1vZHVsZUNvbmZpZyB8IHVuZGVmaW5lZCB7XG4gIGZvciAobGV0IG1vZHVsZUNvbmZpZyBvZiBjb25maWd1cmVkTW9kdWxlcyhzdGF0ZSkpIHtcbiAgICBpZiAocGF0aC5yZWZlcmVuY2VzSW1wb3J0KG1vZHVsZUNvbmZpZy5tb2R1bGVOYW1lLCBtb2R1bGVDb25maWcuZXhwb3J0KSkge1xuICAgICAgcmV0dXJuIG1vZHVsZUNvbmZpZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gcnVudGltZUVycm9ySUlGRShiYWJlbDogdHlwZW9mIEJhYmVsLCByZXBsYWNlbWVudHM6IHsgRVJST1JfTUVTU0FHRTogc3RyaW5nIH0pIHtcbiAgbGV0IHN0YXRlbWVudCA9IGJhYmVsLnRlbXBsYXRlKGAoZnVuY3Rpb24oKSB7XFxuICB0aHJvdyBuZXcgRXJyb3IoJ0VSUk9SX01FU1NBR0UnKTtcXG59KSgpO2ApKFxuICAgIHJlcGxhY2VtZW50c1xuICApIGFzIHQuRXhwcmVzc2lvblN0YXRlbWVudDtcbiAgcmV0dXJuIHN0YXRlbWVudC5leHByZXNzaW9uO1xufVxuXG5mdW5jdGlvbiBidWlsZFNjb3BlTG9jYWxzKFxuICB1c2VyVHlwZWRPcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgZm9ybWF0T3B0aW9uczogTW9kdWxlQ29uZmlnLFxuICB0YXJnZXQ6IE5vZGVQYXRoPHQuRXhwcmVzc2lvbj4sXG4gIG1heVVzZUxleGljYWxUaGlzOiBib29sZWFuXG4pOiBTY29wZUxvY2FscyB7XG4gIGlmIChmb3JtYXRPcHRpb25zLnJmYzkzMVN1cHBvcnQgJiYgdXNlclR5cGVkT3B0aW9ucy5ldmFsKSB7XG4gICAgcmV0dXJuIG5ldyBTY29wZUxvY2Fscyh7IG1vZGU6ICdpbXBsaWNpdCcsIGpzUGF0aDogdGFyZ2V0LCBtYXlVc2VMZXhpY2FsVGhpcyB9KTtcbiAgfSBlbHNlIGlmICh1c2VyVHlwZWRPcHRpb25zLnNjb3BlKSB7XG4gICAgcmV0dXJuIHVzZXJUeXBlZE9wdGlvbnMuc2NvcGUgYXMgU2NvcGVMb2NhbHM7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBTY29wZUxvY2Fscyh7IG1vZGU6ICdleHBsaWNpdCcgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGRQcmVjb21waWxlT3B0aW9uczxFbnZTcGVjaWZpY09wdGlvbnM+KFxuICBiYWJlbDogdHlwZW9mIEJhYmVsLFxuICB0YXJnZXQ6IE5vZGVQYXRoPHQuRXhwcmVzc2lvbj4sXG4gIHN0YXRlOiBTdGF0ZTxFbnZTcGVjaWZpY09wdGlvbnM+LFxuICB0ZW1wbGF0ZTogc3RyaW5nLFxuICB1c2VyVHlwZWRPcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgY29uZmlnOiBNb2R1bGVDb25maWcsXG4gIHNjb3BlOiBTY29wZUxvY2Fsc1xuKTogUHJlcHJvY2Vzc09wdGlvbnMgJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIGxldCBqc3V0aWxzID0gbmV3IEpTVXRpbHMoYmFiZWwsIHN0YXRlLCB0YXJnZXQsIHNjb3BlLmFkZC5iaW5kKHNjb3BlKSwgc3RhdGUudXRpbCk7XG4gIGxldCBtZXRhID0gT2JqZWN0LmFzc2lnbih7IGpzdXRpbHMgfSwgdXNlclR5cGVkT3B0aW9ucz8ubWV0YSk7XG5cbiAgbGV0IG91dHB1dDogUHJlcHJvY2Vzc09wdGlvbnMgJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICBjb250ZW50czogdGVtcGxhdGUsXG5cbiAgICAvLyB3ZSd2ZSBleHRlbmRlZCBtZXRhIHRvIGFkZCBqc3V0aWxzLCBidXQgdGhlIHR5cGVzIGluIEBnbGltbWVyL3N5bnRheFxuICAgIC8vIGRvbid0IGFjY291bnQgZm9yIGV4dGVuc2lvblxuICAgIG1ldGE6IG1ldGEgYXMgUHJlcHJvY2Vzc09wdGlvbnNbJ21ldGEnXSxcblxuICAgIC8vIFRPRE86IGVtYnJvaWRlcidzIHRlbXBsYXRlLWNvbXBpbGVyIGFsbG93cyB0aGlzIHRvIGJlIG92ZXJyaWRlbiB0byBnZXRcbiAgICAvLyBiYWNrd2FyZC1jb21wYXRpYmxlIG1vZHVsZSBuYW1lcyB0aGF0IGRvbid0IG1hdGNoIHRoZSByZWFsIG5hbWUgb2YgdGhlXG4gICAgLy8gb24tZGlzayBmaWxlLiBXaGF0J3Mgb3VyIHBsYW4gZm9yIG1pZ3JhdGluZyBwZW9wbGUgYXdheSBmcm9tIHRoYXQ/XG4gICAgbW9kdWxlTmFtZTogc3RhdGUuZmlsZW5hbWUsXG5cbiAgICAvLyBUaGlzIGlzIGhlcmUgc28gaXQncyAqYWx3YXlzKiB0aGUgcmVhbCBmaWxlbmFtZS4gSGlzdG9yaWNhbGx5LCB0aGVyZSBpc1xuICAgIC8vIGFsc28gYG1vZHVsZU5hbWVgIGJ1dCB0aGF0IGRpZCBub3QgbWF0Y2ggdGhlIHJlYWwgb24tZGlzayBmaWxlbmFtZSwgaXRcbiAgICAvLyB3YXMgdGhlIG5vdGlvbmFsIHJ1bnRpbWUgbW9kdWxlIG5hbWUgZnJvbSBjbGFzc2ljIGVtYmVyIGJ1aWxkcy5cbiAgICBmaWxlbmFtZTogc3RhdGUuZmlsZW5hbWUsXG5cbiAgICBwbHVnaW5zOiB7XG4gICAgICAvLyB0aGUgY2FzdCBpcyBuZWVkZWQgaGVyZSBvbmx5IGJlY2F1c2Ugb3VyIG1ldGEgaXMgZXh0ZW5kZWQuIFRoYXQgaXMsXG4gICAgICAvLyB0aGVzZSBwbHVnaW5zIGNhbiBhY2Nlc3MgbWV0YS5qc3V0aWxzLlxuICAgICAgYXN0OiBbLi4uc3RhdGUubm9ybWFsaXplZE9wdHMudHJhbnNmb3Jtcywgc2NvcGUuY3Jhd2woKV0gYXMgQVNUUGx1Z2luQnVpbGRlcltdLFxuICAgIH0sXG4gIH07XG5cbiAgZm9yIChsZXQgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHVzZXJUeXBlZE9wdGlvbnMpKSB7XG4gICAgaWYgKGtleSAhPT0gJ3Njb3BlJykge1xuICAgICAgLy8gYHNjb3BlYCBpbiB0aGUgdXNlci1mYWNpbmcgQVBJIGJlY29tZXMgYGxvY2Fsc2AgaW4gdGhlIGxvdy1sZXZlbFxuICAgICAgLy8gZW1iZXItdGVtcGxhdGUtY29tcGlsZXIgQVBJXG4gICAgICBvdXRwdXRba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIG91dHB1dC5sb2NhbHMgPSBzY29wZS5sb2NhbHM7XG5cbiAgaWYgKGNvbmZpZy5yZmM5MzFTdXBwb3J0KSB7XG4gICAgb3V0cHV0LnN0cmljdE1vZGUgPSB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuZnVuY3Rpb24gcmVtYXBBbmRCaW5kSWRlbnRpZmllcnModGFyZ2V0OiBOb2RlUGF0aCwgYmFiZWw6IHR5cGVvZiBCYWJlbCwgc2NvcGVMb2NhbHM6IFNjb3BlTG9jYWxzKSB7XG4gIHRhcmdldC50cmF2ZXJzZSh7XG4gICAgSWRlbnRpZmllcihwYXRoOiBOb2RlUGF0aDx0LklkZW50aWZpZXI+KSB7XG4gICAgICBpZiAoc2NvcGVMb2NhbHMuaGFzKHBhdGgubm9kZS5uYW1lKSAmJiBwYXRoLm5vZGUubmFtZSAhPT0gc2NvcGVMb2NhbHMuZ2V0KHBhdGgubm9kZS5uYW1lKSkge1xuICAgICAgICAvLyB0aGlzIGlkZW50aWZpZXIgaGFzIGRpZmZlcmVudCBuYW1lcyBpbiBoYnMgdnMganMsIHNvIHdlIG5lZWQgdG9cbiAgICAgICAgLy8gcmVwbGFjZSB0aGUgaGJzIG5hbWUgaW4gdGhlIHRlbXBsYXRlIGNvbXBpbGVyIG91dHB1dCB3aXRoIHRoZSBqc1xuICAgICAgICAvLyBuYW1lXG4gICAgICAgIHBhdGgucmVwbGFjZVdpdGgoYmFiZWwudHlwZXMuaWRlbnRpZmllcihzY29wZUxvY2Fscy5nZXQocGF0aC5ub2RlLm5hbWUpKSk7XG4gICAgICB9XG4gICAgICAvLyB0aGlzIGlzIHdoZXJlIHdlIHRlbGwgYmFiZWwncyBzY29wZSBzeXN0ZW0gYWJvdXQgdGhlIG5ldyByZWZlcmVuY2Ugd2VcbiAgICAgIC8vIGp1c3QgaW50cm9kdWNlZC4gQGJhYmVsL3BsdWdpbi10cmFuc2Zvcm0tdHlwZXNjcmlwdCBpbiBwYXJ0aWN1bGFyXG4gICAgICAvLyBjYXJlcyBhIGxvdCBhYm91dCB0aG9zZSByZWZlcmVuY2VzIGJlaW5nIHByZXNlbnQuXG4gICAgICBwYXRoLnNjb3BlLmdldEJpbmRpbmcocGF0aC5ub2RlLm5hbWUpPy5yZWZlcmVuY2UocGF0aCk7XG4gICAgfSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGluc2VydENvbXBpbGVkVGVtcGxhdGU8RW52U3BlY2lmaWNPcHRpb25zPihcbiAgYmFiZWw6IHR5cGVvZiBCYWJlbCxcbiAgc3RhdGU6IFN0YXRlPEVudlNwZWNpZmljT3B0aW9ucz4sXG4gIG9wdHM6IFdpcmVPcHRzLFxuICB0ZW1wbGF0ZTogc3RyaW5nLFxuICB0YXJnZXQ6IE5vZGVQYXRoPHQuRXhwcmVzc2lvbj4sXG4gIHVzZXJUeXBlZE9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICBjb25maWc6IE1vZHVsZUNvbmZpZyxcbiAgYmFja2luZ0NsYXNzOiBOb2RlUGF0aDxQYXJhbWV0ZXJzPHR5cGVvZiB0LmNhbGxFeHByZXNzaW9uPlsxXVtudW1iZXJdPiB8IHVuZGVmaW5lZFxuKSB7XG4gIGxldCB0ID0gYmFiZWwudHlwZXM7XG4gIGxldCBzY29wZUxvY2FscyA9IGJ1aWxkU2NvcGVMb2NhbHModXNlclR5cGVkT3B0aW9ucywgY29uZmlnLCB0YXJnZXQsICFiYWNraW5nQ2xhc3MpO1xuICBsZXQgb3B0aW9ucyA9IGJ1aWxkUHJlY29tcGlsZU9wdGlvbnMoXG4gICAgYmFiZWwsXG4gICAgdGFyZ2V0LFxuICAgIHN0YXRlLFxuICAgIHRlbXBsYXRlLFxuICAgIHVzZXJUeXBlZE9wdGlvbnMsXG4gICAgY29uZmlnLFxuICAgIHNjb3BlTG9jYWxzXG4gICk7XG5cbiAgbGV0IHByZWNvbXBpbGVSZXN1bHRTdHJpbmc6IHN0cmluZztcblxuICAvLyBpbnNlcnRSdW50aW1lRXJyb3JzIGlzIGxlZ2FjeSBhbmQgbm90IHN1cHBvcnRlZCBieSB0aGUgbmV3ZXIgcmZjOTMxIGZvcm1cbiAgaWYgKG9wdGlvbnMuaW5zZXJ0UnVudGltZUVycm9ycyAmJiAhY29uZmlnLnJmYzkzMVN1cHBvcnQpIHtcbiAgICB0cnkge1xuICAgICAgcHJlY29tcGlsZVJlc3VsdFN0cmluZyA9IG9wdHMuY29tcGlsZXIucHJlY29tcGlsZSh0ZW1wbGF0ZSwgb3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRhcmdldC5yZXBsYWNlV2l0aChydW50aW1lRXJyb3JJSUZFKGJhYmVsLCB7IEVSUk9SX01FU1NBR0U6IChlcnJvciBhcyBhbnkpLm1lc3NhZ2UgfSkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwcmVjb21waWxlUmVzdWx0U3RyaW5nID0gb3B0cy5jb21waWxlci5wcmVjb21waWxlKHRlbXBsYXRlLCBvcHRpb25zKTtcbiAgfVxuXG4gIGxldCB0ZW1wbGF0ZUV4cHJlc3Npb24gPSBiYWJlbC50ZW1wbGF0ZS5leHByZXNzaW9uLmFzdChwcmVjb21waWxlUmVzdWx0U3RyaW5nKTtcblxuICB0LmFkZENvbW1lbnQoXG4gICAgdGVtcGxhdGVFeHByZXNzaW9uLFxuICAgICdsZWFkaW5nJyxcbiAgICBgXFxuICAke3RlbXBsYXRlLnJlcGxhY2UoL1xcKlxcLy9nLCAnKlxcXFwvJyl9XFxuYCxcbiAgICAvKiBsaW5lIGNvbW1lbnQ/ICovIGZhbHNlXG4gICk7XG5cbiAgc3RhdGUudXRpbC5yZXBsYWNlV2l0aCh0YXJnZXQsIChpKSA9PiB7XG4gICAgbGV0IHRlbXBsYXRlRmFjdG9yeUlkZW50aWZpZXIgPSBpLmltcG9ydChcbiAgICAgIHN0YXRlLnRlbXBsYXRlRmFjdG9yeS5tb2R1bGVOYW1lLFxuICAgICAgc3RhdGUudGVtcGxhdGVGYWN0b3J5LmV4cG9ydE5hbWVcbiAgICApO1xuXG4gICAgbGV0IGV4cHJlc3Npb24gPSB0LmNhbGxFeHByZXNzaW9uKHRlbXBsYXRlRmFjdG9yeUlkZW50aWZpZXIsIFt0ZW1wbGF0ZUV4cHJlc3Npb25dKTtcblxuICAgIGlmIChjb25maWcucmZjOTMxU3VwcG9ydCkge1xuICAgICAgZXhwcmVzc2lvbiA9IHQuY2FsbEV4cHJlc3Npb24oaS5pbXBvcnQoJ0BlbWJlci9jb21wb25lbnQnLCAnc2V0Q29tcG9uZW50VGVtcGxhdGUnKSwgW1xuICAgICAgICBleHByZXNzaW9uLFxuICAgICAgICBiYWNraW5nQ2xhc3M/Lm5vZGUgPz9cbiAgICAgICAgICB0LmNhbGxFeHByZXNzaW9uKFxuICAgICAgICAgICAgaS5pbXBvcnQoJ0BlbWJlci9jb21wb25lbnQvdGVtcGxhdGUtb25seScsICdkZWZhdWx0JywgJ3RlbXBsYXRlT25seScpLFxuICAgICAgICAgICAgW11cbiAgICAgICAgICApLFxuICAgICAgXSk7XG4gICAgfVxuICAgIHJldHVybiBleHByZXNzaW9uO1xuICB9KTtcblxuICByZW1hcEFuZEJpbmRJZGVudGlmaWVycyh0YXJnZXQsIGJhYmVsLCBzY29wZUxvY2Fscyk7XG59XG5cbmZ1bmN0aW9uIGluc2VydFRyYW5zZm9ybWVkVGVtcGxhdGU8RW52U3BlY2lmaWNPcHRpb25zPihcbiAgYmFiZWw6IHR5cGVvZiBCYWJlbCxcbiAgc3RhdGU6IFN0YXRlPEVudlNwZWNpZmljT3B0aW9ucz4sXG4gIHRlbXBsYXRlOiBzdHJpbmcsXG4gIHRhcmdldDogTm9kZVBhdGg8dC5DYWxsRXhwcmVzc2lvbj4gfCBOb2RlUGF0aDx0LlRhZ2dlZFRlbXBsYXRlRXhwcmVzc2lvbj4sXG4gIHVzZXJUeXBlZE9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICBmb3JtYXRPcHRpb25zOiBNb2R1bGVDb25maWcsXG4gIGJhY2tpbmdDbGFzczogTm9kZVBhdGg8UGFyYW1ldGVyczx0eXBlb2YgdC5jYWxsRXhwcmVzc2lvbj5bMV1bbnVtYmVyXT4gfCB1bmRlZmluZWRcbikge1xuICBsZXQgdCA9IGJhYmVsLnR5cGVzO1xuICBsZXQgc2NvcGVMb2NhbHMgPSBidWlsZFNjb3BlTG9jYWxzKHVzZXJUeXBlZE9wdGlvbnMsIGZvcm1hdE9wdGlvbnMsIHRhcmdldCwgIWJhY2tpbmdDbGFzcyk7XG4gIGxldCBvcHRpb25zID0gYnVpbGRQcmVjb21waWxlT3B0aW9ucyhcbiAgICBiYWJlbCxcbiAgICB0YXJnZXQsXG4gICAgc3RhdGUsXG4gICAgdGVtcGxhdGUsXG4gICAgdXNlclR5cGVkT3B0aW9ucyxcbiAgICBmb3JtYXRPcHRpb25zLFxuICAgIHNjb3BlTG9jYWxzXG4gICk7XG4gIGxldCBhc3QgPSBwcmVwcm9jZXNzKHRlbXBsYXRlLCB7IC4uLm9wdGlvbnMsIG1vZGU6ICdjb2RlbW9kJyB9KTtcbiAgbGV0IHRyYW5zZm9ybWVkID0gcHJpbnQoYXN0LCB7IGVudGl0eUVuY29kaW5nOiAncmF3JyB9KTtcblxuICBpZiAodGFyZ2V0LmlzQ2FsbEV4cHJlc3Npb24oKSkge1xuICAgIHVwZGF0ZUNhbGxGb3JtPEVudlNwZWNpZmljT3B0aW9ucz4oXG4gICAgICB0YXJnZXQsXG4gICAgICB0cmFuc2Zvcm1lZCxcbiAgICAgIGZvcm1hdE9wdGlvbnMsXG4gICAgICBzY29wZUxvY2FscyxcbiAgICAgIHN0YXRlLFxuICAgICAgYmFiZWwsXG4gICAgICBiYWNraW5nQ2xhc3NcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZUJhY2t0aWNrRm9ybTxFbnZTcGVjaWZpY09wdGlvbnM+KHNjb3BlTG9jYWxzLCBzdGF0ZSwgdGFyZ2V0LCB0LCB0cmFuc2Zvcm1lZCwgYmFiZWwpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUJhY2t0aWNrRm9ybTxFbnZTcGVjaWZpY09wdGlvbnM+KFxuICBzY29wZUxvY2FsczogU2NvcGVMb2NhbHMsXG4gIHN0YXRlOiBTdGF0ZTxFbnZTcGVjaWZpY09wdGlvbnM+LFxuICB0YXJnZXQ6IE5vZGVQYXRoPHQuVGFnZ2VkVGVtcGxhdGVFeHByZXNzaW9uPixcbiAgdDogdHlwZW9mIEJhYmVsLnR5cGVzLFxuICB0cmFuc2Zvcm1lZDogc3RyaW5nLFxuICBiYWJlbDogdHlwZW9mIEJhYmVsXG4pIHtcbiAgaWYgKHNjb3BlTG9jYWxzLmlzRW1wdHkoKSkge1xuICAgIC8vIHNpbXBsZSBjYXNlOiBqdXN0IHJlcGxhY2UgdGhlIHN0cmluZyBsaXRlcmFsIHBhcnQgd2l0aCB0aGUgdHJhbnNmb3JtZWRcbiAgICAvLyB0ZW1wbGF0ZSBjb250ZW50c1xuICAgICh0YXJnZXQuZ2V0KCdxdWFzaScpLmdldCgncXVhc2lzLjAnKSBhcyBOb2RlUGF0aDx0LlRlbXBsYXRlRWxlbWVudD4pLnJlcGxhY2VXaXRoKFxuICAgICAgdC50ZW1wbGF0ZUVsZW1lbnQoeyByYXc6IHRyYW5zZm9ybWVkIH0pXG4gICAgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBuZWVkIHRvIGFkZCBzY29wZSwgc28gbmVlZCB0byByZXBsYWNlIHRoZSBiYWNrdGlja3MgZm9ybSB3aXRoIGEgY2FsbFxuICAvLyBleHByZXNzaW9uIHRvIHByZWNvbXBpbGVUZW1wbGF0ZVxuICBtYXliZVBydW5lSW1wb3J0KHN0YXRlLnV0aWwsIHRhcmdldC5nZXQoJ3RhZycpKTtcbiAgbGV0IG5ld0NhbGwgPSBzdGF0ZS51dGlsLnJlcGxhY2VXaXRoKHRhcmdldCwgKGkpID0+XG4gICAgdC5jYWxsRXhwcmVzc2lvbihwcmVjb21waWxlVGVtcGxhdGUoaSksIFt0LnN0cmluZ0xpdGVyYWwodHJhbnNmb3JtZWQpXSlcbiAgKTtcbiAgdXBkYXRlU2NvcGUoYmFiZWwsIG5ld0NhbGwsIHNjb3BlTG9jYWxzKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ2FsbEZvcm08RW52U3BlY2lmaWNPcHRpb25zPihcbiAgdGFyZ2V0OiBOb2RlUGF0aDxCYWJlbC50eXBlcy5DYWxsRXhwcmVzc2lvbj4sXG4gIHRyYW5zZm9ybWVkOiBzdHJpbmcsXG4gIGZvcm1hdE9wdGlvbnM6IE1vZHVsZUNvbmZpZyxcbiAgc2NvcGVMb2NhbHM6IFNjb3BlTG9jYWxzLFxuICBzdGF0ZTogU3RhdGU8RW52U3BlY2lmaWNPcHRpb25zPixcbiAgYmFiZWw6IHR5cGVvZiBCYWJlbCxcbiAgYmFja2luZ0NsYXNzOlxuICAgIHwgTm9kZVBhdGg8QmFiZWwudHlwZXMuRXhwcmVzc2lvbiB8IEJhYmVsLnR5cGVzLkFyZ3VtZW50UGxhY2Vob2xkZXIgfCBCYWJlbC50eXBlcy5TcHJlYWRFbGVtZW50PlxuICAgIHwgdW5kZWZpbmVkXG4pIHtcbiAgLy8gZmlyc3QgdGhlIHNpbXBsZSBwYXJ0OiByZXBsYWNpbmcgdGhlIHN0cmluZyBsaXRlcmFsIHdpdGggdGhlIGFjdHVhbCBib2R5IG9mXG4gIC8vIHRoZSByZXdyaXR0ZW4gdGVtcGxhdGVcbiAgKHRhcmdldC5nZXQoJ2FyZ3VtZW50cy4wJykgYXMgTm9kZVBhdGg8dC5Ob2RlPikucmVwbGFjZVdpdGgoXG4gICAgYmFiZWwudHlwZXMuc3RyaW5nTGl0ZXJhbCh0cmFuc2Zvcm1lZClcbiAgKTtcblxuICBpZiAoIWZvcm1hdE9wdGlvbnMuZW5hYmxlU2NvcGUgJiYgIXNjb3BlTG9jYWxzLmlzRW1wdHkoKSkge1xuICAgIC8vIGFuIEFTVCB0cmFuc2Zvcm0gYWRkZWQgbGV4aWNhbGx5IHNjb3BlZCB2YWx1ZXMgdG8gYSB0ZW1wbGF0ZSB0aGF0XG4gICAgLy8gd2Fzbid0IGFscmVhZHkgaW4gYSBmb3JtIHRoYXQgc3VwcG9ydHMgdGhlbSwgc28gY29udmVydCBmb3JtLlxuICAgIG1heWJlUHJ1bmVJbXBvcnQoc3RhdGUudXRpbCwgdGFyZ2V0LmdldCgnY2FsbGVlJykpO1xuICAgIHN0YXRlLnV0aWwucmVwbGFjZVdpdGgodGFyZ2V0LmdldCgnY2FsbGVlJyksIChpKSA9PiBwcmVjb21waWxlVGVtcGxhdGUoaSkpO1xuICB9XG5cbiAgaWYgKGZvcm1hdE9wdGlvbnMucmZjOTMxU3VwcG9ydCA9PT0gJ3BvbHlmaWxsZWQnKSB7XG4gICAgbWF5YmVQcnVuZUltcG9ydChzdGF0ZS51dGlsLCB0YXJnZXQuZ2V0KCdjYWxsZWUnKSk7XG4gICAgc3RhdGUudXRpbC5yZXBsYWNlV2l0aCh0YXJnZXQuZ2V0KCdjYWxsZWUnKSwgKGkpID0+IHByZWNvbXBpbGVUZW1wbGF0ZShpKSk7XG4gICAgY29udmVydFN0cmljdE1vZGUoYmFiZWwsIHRhcmdldCk7XG4gICAgcmVtb3ZlRXZhbEFuZFNjb3BlKHRhcmdldCk7XG4gICAgdGFyZ2V0Lm5vZGUuYXJndW1lbnRzID0gdGFyZ2V0Lm5vZGUuYXJndW1lbnRzLnNsaWNlKDAsIDIpO1xuICAgIHN0YXRlLnJlY3Vyc2lvbkd1YXJkLmFkZCh0YXJnZXQubm9kZSk7XG4gICAgc3RhdGUudXRpbC5yZXBsYWNlV2l0aCh0YXJnZXQsIChpKSA9PlxuICAgICAgYmFiZWwudHlwZXMuY2FsbEV4cHJlc3Npb24oaS5pbXBvcnQoJ0BlbWJlci9jb21wb25lbnQnLCAnc2V0Q29tcG9uZW50VGVtcGxhdGUnKSwgW1xuICAgICAgICB0YXJnZXQubm9kZSxcbiAgICAgICAgYmFja2luZ0NsYXNzPy5ub2RlID8/XG4gICAgICAgICAgYmFiZWwudHlwZXMuY2FsbEV4cHJlc3Npb24oXG4gICAgICAgICAgICBpLmltcG9ydCgnQGVtYmVyL2NvbXBvbmVudC90ZW1wbGF0ZS1vbmx5JywgJ2RlZmF1bHQnLCAndGVtcGxhdGVPbmx5JyksXG4gICAgICAgICAgICBbXVxuICAgICAgICAgICksXG4gICAgICBdKVxuICAgICk7XG4gICAgLy8gd2UganVzdCB3cmFwcGVkIHRoZSB0YXJnZXQgY2FsbEV4cHJlc3Npb24gaW4gdGhlIGNhbGwgdG9cbiAgICAvLyBzZXRDb21wb25lbnRUZW1wbGF0ZS4gQWRqdXN0IGB0YXJnZXRgIGJhY2sgdG8gcG9pbnQgYXQgdGhlXG4gICAgLy8gcHJlY29tcGlsZVRlbXBsYXRlIGNhbGwgZm9yIHRoZSBmaW5hbCB1cGRhdGVTY29wZSBiZWxvdy5cbiAgICAvL1xuICAgIHRhcmdldCA9IHRhcmdldC5nZXQoJ2FyZ3VtZW50cy4wJykgYXMgTm9kZVBhdGg8dC5DYWxsRXhwcmVzc2lvbj47XG4gIH1cbiAgLy8gV2UgZGVsaWJlcmF0ZWx5IGRvIHVwZGF0ZVNjb3BlIGF0IHRoZSBlbmQgc28gdGhhdCB3aGVuIGl0IHVwZGF0ZXNcbiAgLy8gcmVmZXJlbmNlcywgdGhvc2UgcmVmZXJlbmNlcyB3aWxsIHBvaW50IHRvIHRoZSBhY2N1cmF0ZSBwYXRocyBpbiB0aGVcbiAgLy8gZmluYWwgQVNULlxuICB1cGRhdGVTY29wZShiYWJlbCwgdGFyZ2V0LCBzY29wZUxvY2Fscyk7XG59XG5cbmZ1bmN0aW9uIHRlbXBsYXRlRmFjdG9yeUNvbmZpZyhvcHRzOiBOb3JtYWxpemVkT3B0cykge1xuICBsZXQgbW9kdWxlTmFtZSA9ICdAZW1iZXIvdGVtcGxhdGUtZmFjdG9yeSc7XG4gIGxldCBleHBvcnROYW1lID0gJ2NyZWF0ZVRlbXBsYXRlRmFjdG9yeSc7XG4gIGxldCBvdmVycmlkZXMgPSBvcHRzLm91dHB1dE1vZHVsZU92ZXJyaWRlc1ttb2R1bGVOYW1lXT8uW2V4cG9ydE5hbWVdO1xuICByZXR1cm4gb3ZlcnJpZGVzXG4gICAgPyB7IGV4cG9ydE5hbWU6IG92ZXJyaWRlc1swXSwgbW9kdWxlTmFtZTogb3ZlcnJpZGVzWzFdIH1cbiAgICA6IHsgZXhwb3J0TmFtZSwgbW9kdWxlTmFtZSB9O1xufVxuXG5mdW5jdGlvbiBidWlsZFNjb3BlKGJhYmVsOiB0eXBlb2YgQmFiZWwsIGxvY2FsczogU2NvcGVMb2NhbHMpIHtcbiAgbGV0IHQgPSBiYWJlbC50eXBlcztcblxuICByZXR1cm4gdC5hcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbihcbiAgICBbXSxcbiAgICB0Lm9iamVjdEV4cHJlc3Npb24oXG4gICAgICBsb2NhbHNcbiAgICAgICAgLmVudHJpZXMoKVxuICAgICAgICAubWFwKChbbmFtZSwgaWRlbnRpZmllcl0pID0+XG4gICAgICAgICAgdC5vYmplY3RQcm9wZXJ0eSh0LmlkZW50aWZpZXIobmFtZSksIHQuaWRlbnRpZmllcihpZGVudGlmaWVyKSwgZmFsc2UsIG5hbWUgIT09ICd0aGlzJylcbiAgICAgICAgKVxuICAgIClcbiAgKTtcbn1cblxuLy8gdGhpcyBpcyByZXNwb25zaWJsZSBib3RoIGZvciBhZGp1c3RpbmcgdGhlIEFTVCBmb3Igb3VyIHNjb3BlIGFyZ3VtZW50ICphbmQqXG4vLyBlbnN1cmluZyB0aGF0IGJhYmVsJ3Mgc2NvcGUgc3lzdGVtIHdpbGwgc2VlIHRoYXQgdGhlc2UgbmV3IGlkZW50aWZpZXJzXG4vLyByZWZlcmVuY2UgdGhlaXIgYmluZGluZ3MuIEBiYWJlbC9wbHVnaW4tdHJhbnNmb3JtLXR5cGVzY3JpcHQgaW4gcGFydGljdWxhclxuLy8gY2FyZXMgYW4gYXdmdWwgbG90IGFib3V0IHdoZXRoZXIgYW4gaW1wb3J0IGhhcyB2YWxpZCBub24tdHlwZSByZWZlcmVuY2VzLCBzb1xuLy8gdGhlc2UgbmV3bHkgaW50cm9kdWNkIHJlZmVyZW5jZXMgbmVlZCB0byBiZSB2YWxpZC5cbmZ1bmN0aW9uIHVwZGF0ZVNjb3BlKGJhYmVsOiB0eXBlb2YgQmFiZWwsIHRhcmdldDogTm9kZVBhdGg8dC5DYWxsRXhwcmVzc2lvbj4sIGxvY2FsczogU2NvcGVMb2NhbHMpIHtcbiAgbGV0IHQgPSBiYWJlbC50eXBlcztcbiAgbGV0IHNlY29uZEFyZyA9IHRhcmdldC5nZXQoJ2FyZ3VtZW50cy4xJykgYXMgTm9kZVBhdGg8dC5PYmplY3RFeHByZXNzaW9uPiB8IHVuZGVmaW5lZDtcbiAgaWYgKHNlY29uZEFyZykge1xuICAgIGxldCBzY29wZSA9IHNlY29uZEFyZy5nZXQoJ3Byb3BlcnRpZXMnKS5maW5kKChwKSA9PiB7XG4gICAgICBsZXQga2V5ID0gcC5nZXQoJ2tleScpIGFzIE5vZGVQYXRoPHQuTm9kZT47XG4gICAgICByZXR1cm4ga2V5LmlzSWRlbnRpZmllcigpICYmIGtleS5ub2RlLm5hbWUgPT09ICdzY29wZSc7XG4gICAgfSk7XG4gICAgaWYgKHNjb3BlKSB7XG4gICAgICBpZiAobG9jYWxzLmlzRW1wdHkoKSkge1xuICAgICAgICBzY29wZS5yZW1vdmUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjb3BlLnNldCgndmFsdWUnLCBidWlsZFNjb3BlKGJhYmVsLCBsb2NhbHMpKTtcbiAgICAgICAgLy8gZnVubnktbG9va2luZyBuYW1pbmcgaGVyZSwgYnV0IGl0IGFjdHVhbGx5IG1ha2VzIHNlbnNlIGJlY2F1c2Ugd2UncmVcbiAgICAgICAgLy8gY29ubmVjdGluZyB0aGUgZ2xpbW1lciBzY29wZSBzeXN0ZW0gd2l0aCB0aGUgYmFiZWwgc2NvcGUgc3lzdGVtLlxuICAgICAgICBzY29wZS5zY29wZS5jcmF3bCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWxvY2Fscy5pc0VtcHR5KCkpIHtcbiAgICAgIHNlY29uZEFyZy5wdXNoQ29udGFpbmVyKFxuICAgICAgICAncHJvcGVydGllcycsXG4gICAgICAgIHQub2JqZWN0UHJvcGVydHkodC5pZGVudGlmaWVyKCdzY29wZScpLCBidWlsZFNjb3BlKGJhYmVsLCBsb2NhbHMpKVxuICAgICAgKTtcbiAgICAgIChcbiAgICAgICAgc2Vjb25kQXJnLmdldChcbiAgICAgICAgICBgcHJvcGVydGllcy4ke3NlY29uZEFyZy5ub2RlLnByb3BlcnRpZXMubGVuZ3RoIC0gMX1gXG4gICAgICAgICkgYXMgTm9kZVBhdGg8dC5PYmplY3RQcm9wZXJ0eT5cbiAgICAgICkuc2NvcGUuY3Jhd2woKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoIWxvY2Fscy5pc0VtcHR5KCkpIHtcbiAgICB0YXJnZXQucHVzaENvbnRhaW5lcihcbiAgICAgICdhcmd1bWVudHMnLFxuICAgICAgdC5vYmplY3RFeHByZXNzaW9uKFt0Lm9iamVjdFByb3BlcnR5KHQuaWRlbnRpZmllcignc2NvcGUnKSwgYnVpbGRTY29wZShiYWJlbCwgbG9jYWxzKSldKVxuICAgICk7XG4gICAgKHRhcmdldC5nZXQoJ2FyZ3VtZW50cy4xJykgYXMgTm9kZVBhdGg8dC5PYmplY3RFeHByZXNzaW9uPikuc2NvcGUuY3Jhd2woKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVFdmFsQW5kU2NvcGUodGFyZ2V0OiBOb2RlUGF0aDx0LkNhbGxFeHByZXNzaW9uPikge1xuICBsZXQgc2Vjb25kQXJnID0gdGFyZ2V0LmdldCgnYXJndW1lbnRzLjEnKSBhcyBOb2RlUGF0aDx0Lk9iamVjdEV4cHJlc3Npb24+IHwgdW5kZWZpbmVkO1xuICBpZiAoc2Vjb25kQXJnKSB7XG4gICAgbGV0IGV2YWxQcm9wID0gc2Vjb25kQXJnLmdldCgncHJvcGVydGllcycpLmZpbmQoKHApID0+IHtcbiAgICAgIGxldCBrZXkgPSBwLmdldCgna2V5JykgYXMgTm9kZVBhdGg8dC5Ob2RlPjtcbiAgICAgIHJldHVybiBrZXkuaXNJZGVudGlmaWVyKCkgJiYga2V5Lm5vZGUubmFtZSA9PT0gJ2V2YWwnO1xuICAgIH0pO1xuICAgIGlmIChldmFsUHJvcCkge1xuICAgICAgZXZhbFByb3AucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgbGV0IGNvbXBvbmVudFByb3AgPSBzZWNvbmRBcmcuZ2V0KCdwcm9wZXJ0aWVzJykuZmluZCgocCkgPT4ge1xuICAgICAgbGV0IGtleSA9IHAuZ2V0KCdrZXknKSBhcyBOb2RlUGF0aDx0Lk5vZGU+O1xuICAgICAgcmV0dXJuIGtleS5pc0lkZW50aWZpZXIoKSAmJiBrZXkubm9kZS5uYW1lID09PSAnY29tcG9uZW50JztcbiAgICB9KTtcbiAgICBpZiAoY29tcG9uZW50UHJvcCkge1xuICAgICAgY29tcG9uZW50UHJvcC5yZW1vdmUoKTtcbiAgICB9XG4gIH1cbn1cblxuLy8gR2l2ZW4gYSBjYWxsIHRvIHRlbXBsYXRlKCksIGNvbnZlcnQgaXRzIFwic3RyaWN0XCIgYXJndW1lbnQgaW50b1xuLy8gcHJlY29tcGlsZVRlbXBsYXRlJ3MgXCJzdHJpY3RNb2RlXCIgYXJndW1lbnQuIFRoZXkgZGlmZmVyIGluIG5hbWUgYW5kIGRlZmF1bHRcbi8vIHZhbHVlLlxuZnVuY3Rpb24gY29udmVydFN0cmljdE1vZGUoYmFiZWw6IHR5cGVvZiBCYWJlbCwgdGFyZ2V0OiBOb2RlUGF0aDx0LkNhbGxFeHByZXNzaW9uPikge1xuICBsZXQgdCA9IGJhYmVsLnR5cGVzO1xuICBsZXQgc2Vjb25kQXJnID0gdGFyZ2V0LmdldCgnYXJndW1lbnRzLjEnKSBhcyBOb2RlUGF0aDx0Lk9iamVjdEV4cHJlc3Npb24+IHwgdW5kZWZpbmVkO1xuICBpZiAoc2Vjb25kQXJnKSB7XG4gICAgbGV0IHN0cmljdCA9IHNlY29uZEFyZy5nZXQoJ3Byb3BlcnRpZXMnKS5maW5kKChwKSA9PiB7XG4gICAgICBsZXQga2V5ID0gcC5nZXQoJ2tleScpIGFzIE5vZGVQYXRoPHQuTm9kZT47XG4gICAgICByZXR1cm4ga2V5LmlzSWRlbnRpZmllcigpICYmIGtleS5ub2RlLm5hbWUgPT09ICdzdHJpY3QnO1xuICAgIH0pIGFzIE5vZGVQYXRoPHQuT2JqZWN0UHJvcGVydHk+O1xuICAgIGlmIChzdHJpY3QpIHtcbiAgICAgIHN0cmljdC5zZXQoJ2tleScsIHQuaWRlbnRpZmllcignc3RyaWN0TW9kZScpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2Vjb25kQXJnLnB1c2hDb250YWluZXIoXG4gICAgICAgICdwcm9wZXJ0aWVzJyxcbiAgICAgICAgdC5vYmplY3RQcm9wZXJ0eSh0LmlkZW50aWZpZXIoJ3N0cmljdE1vZGUnKSwgdC5ib29sZWFuTGl0ZXJhbCh0cnVlKSlcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5wdXNoQ29udGFpbmVyKFxuICAgICAgJ2FyZ3VtZW50cycsXG4gICAgICB0Lm9iamVjdEV4cHJlc3Npb24oW3Qub2JqZWN0UHJvcGVydHkodC5pZGVudGlmaWVyKCdzdHJpY3RNb2RlJyksIHQuYm9vbGVhbkxpdGVyYWwodHJ1ZSkpXSlcbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlUHJ1bmVJbXBvcnQoXG4gIHV0aWw6IEltcG9ydFV0aWwsXG4gIGlkZW50aWZpZXI6IE5vZGVQYXRoPHQuRXhwcmVzc2lvbiB8IHQuVjhJbnRyaW5zaWNJZGVudGlmaWVyPlxuKSB7XG4gIGlmICghaWRlbnRpZmllci5pc0lkZW50aWZpZXIoKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgYmluZGluZyA9IGlkZW50aWZpZXIuc2NvcGUuZ2V0QmluZGluZyhpZGVudGlmaWVyLm5vZGUubmFtZSk7XG5cbiAgaWYgKCFiaW5kaW5nKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbGV0IGZvdW5kID0gYmluZGluZy5yZWZlcmVuY2VQYXRocy5maW5kKChwYXRoKSA9PiBwYXRoLm5vZGUgPT09IGlkZW50aWZpZXIubm9kZSk7XG4gIGlmICghZm91bmQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBiaW5kaW5nLnJlZmVyZW5jZVBhdGhzLnNwbGljZShiaW5kaW5nLnJlZmVyZW5jZVBhdGhzLmluZGV4T2YoZm91bmQpLCAxKTtcbiAgYmluZGluZy5yZWZlcmVuY2VzLS07XG5cbiAgaWYgKGJpbmRpbmcucmVmZXJlbmNlcyA9PT0gMCkge1xuICAgIGxldCBzcGVjaWZpZXIgPSBiaW5kaW5nLnBhdGg7XG4gICAgaWYgKHNwZWNpZmllci5pc0ltcG9ydFNwZWNpZmllcigpKSB7XG4gICAgICBsZXQgZGVjbGFyYXRpb24gPSBzcGVjaWZpZXIucGFyZW50UGF0aCBhcyBOb2RlUGF0aDx0LkltcG9ydERlY2xhcmF0aW9uPjtcbiAgICAgIHV0aWwucmVtb3ZlSW1wb3J0KGRlY2xhcmF0aW9uLm5vZGUuc291cmNlLnZhbHVlLCBuYW1lKHNwZWNpZmllci5ub2RlLmltcG9ydGVkKSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHByZWNvbXBpbGVUZW1wbGF0ZShpOiBJbXBvcnRlcikge1xuICByZXR1cm4gaS5pbXBvcnQoJ0BlbWJlci90ZW1wbGF0ZS1jb21waWxhdGlvbicsICdwcmVjb21waWxlVGVtcGxhdGUnKTtcbn1cblxuZnVuY3Rpb24gbmFtZShub2RlOiB0LlN0cmluZ0xpdGVyYWwgfCB0LklkZW50aWZpZXIpIHtcbiAgaWYgKG5vZGUudHlwZSA9PT0gJ1N0cmluZ0xpdGVyYWwnKSB7XG4gICAgcmV0dXJuIG5vZGUudmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5vZGUubmFtZTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWtlUGx1Z2luPE9wdGlvbnM+KChvcHRpb25zKSA9PiBvcHRpb25zKTtcbiJdfQ==