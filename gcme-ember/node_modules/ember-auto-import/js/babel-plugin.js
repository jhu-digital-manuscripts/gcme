"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
// @ts-ignore
const babel_plugin_syntax_dynamic_import_1 = __importDefault(require("babel-plugin-syntax-dynamic-import"));
const package_1 = __importDefault(require("./package"));
function emberAutoImport(babel) {
    let t = babel.types;
    return {
        inherits: babel_plugin_syntax_dynamic_import_1.default,
        visitor: {
            Import(path, state) {
                var _a, _b;
                let call = path.parentPath;
                let arg = call.node.arguments[0];
                if (arg.type === 'StringLiteral') {
                    let cat = package_1.default.categorize(arg.value);
                    if (cat === 'dep') {
                        call.replaceWith(t.callExpression(t.identifier('emberAutoImportDynamic'), [arg]));
                    }
                }
                else if (arg.type === 'TemplateLiteral') {
                    const importedPathPrefix = arg.quasis[0].value.cooked;
                    let cat = package_1.default.categorize(importedPathPrefix, true);
                    if (cat === 'dep') {
                        call.replaceWith(t.callExpression(t.identifier('emberAutoImportDynamic'), [
                            t.stringLiteral(arg.quasis.map((q) => q.value.cooked).join('${e}')),
                            ...arg.expressions,
                        ]));
                    }
                    else if (cat === 'local') {
                        const resolvePath = (_b = (_a = state.file.opts.plugins.find((p) => p.key === 'module-resolver')) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.resolvePath;
                        if (!resolvePath) {
                            throw new Error(`You attempted to dynamically import a relative path in ${state.file.opts.filename} but ember-auto-import was unable to locate the module-resolver plugin. Please file an issue https://github.com/embroider-build/ember-auto-import/issues/new`);
                        }
                        // const sourcePath = path.node.value;
                        const currentFile = state.file.opts.filename;
                        const modulePath = resolvePath(importedPathPrefix, currentFile, state.opts);
                        if (modulePath) {
                            call.replaceWith(t.callExpression(t.identifier('emberAutoImportDynamic'), [
                                t.stringLiteral(arg.quasis
                                    .map((q, index) => {
                                    // replace the first quasis (importedPathPrefix) with the resolved modulePath
                                    if (index === 0) {
                                        return modulePath;
                                    }
                                    return q.value.cooked;
                                })
                                    .join('${e}')),
                                ...arg.expressions,
                            ]));
                        }
                    }
                }
            },
            CallExpression(path) {
                let callee = path.get('callee');
                if (callee.isIdentifier() &&
                    callee.referencesImport('@embroider/macros', 'importSync')) {
                    let arg = path.node.arguments[0];
                    if (arg.type === 'StringLiteral') {
                        let cat = package_1.default.categorize(arg.value);
                        if (cat === 'url') {
                            throw new Error('You cannot use importSync() with a URL.');
                        }
                        callee.replaceWith(t.identifier('require'));
                    }
                    else if (arg.type === 'TemplateLiteral') {
                        let cat = package_1.default.categorize(arg.quasis[0].value.cooked, true);
                        if (cat === 'url') {
                            throw new Error('You cannot use importSync() with a URL.');
                        }
                        path.replaceWith(t.callExpression(t.identifier('emberAutoImportSync'), [
                            t.stringLiteral(arg.quasis.map((q) => q.value.cooked).join('${e}')),
                            ...arg.expressions,
                        ]));
                    }
                }
            },
        },
    };
}
emberAutoImport.baseDir = function () {
    return __dirname;
};
module.exports = emberAutoImport;
//# sourceMappingURL=babel-plugin.js.map