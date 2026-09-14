"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginPath = void 0;
exports.default = main;
const fs_1 = require("fs");
const path_1 = require("path");
const _1 = require(".");
const babel_import_util_1 = require("babel-import-util");
const debug_1 = __importDefault(require("debug"));
const minimatch_1 = __importDefault(require("minimatch"));
const paths_1 = require("./paths");
const debug = (0, debug_1.default)('embroider:template-colocation-plugin');
exports.pluginPath = __filename;
function setComponentTemplate(target, state) {
    return state.adder.import(target, '@ember/component', 'setComponentTemplate');
}
function main(babel) {
    let t = babel.types;
    return {
        visitor: {
            Program: {
                enter(path, state) {
                    var _a, _b;
                    state.adder = new babel_import_util_1.ImportUtil(babel, path);
                    let filename = (0, paths_1.cleanUrl)(path.hub.file.opts.filename);
                    if (state.opts.packageGuard) {
                        let owningPackage = _1.PackageCache.shared('embroider', state.opts.appRoot).ownerOfFile(filename);
                        if (!owningPackage || !owningPackage.needsLooseResolving()) {
                            debug('not handling colocation for %s', filename);
                            return;
                        }
                    }
                    if ((_a = state.opts.exclude) === null || _a === void 0 ? void 0 : _a.some(glob => (0, minimatch_1.default)((0, paths_1.correspondingTemplate)(filename), glob))) {
                        debug('not handling colocation for %s', filename);
                        return;
                    }
                    debug('handling colocation for %s', filename);
                    let extensions = (_b = state.opts.templateExtensions) !== null && _b !== void 0 ? _b : ['.hbs'];
                    for (let ext of extensions) {
                        let hbsFilename = filename.replace(/\.\w{1,3}$/, '') + ext;
                        debug('checking %s', hbsFilename);
                        if (hbsFilename !== filename && (0, fs_1.existsSync)(hbsFilename)) {
                            state.colocatedTemplate = hbsFilename;
                            debug('found colocated template %s', hbsFilename);
                            break;
                        }
                    }
                },
                exit(path, state) {
                    if (state.associate) {
                        path.node.body.push(t.expressionStatement(t.callExpression(setComponentTemplate(path, state), [
                            state.associate.template,
                            state.associate.component,
                        ])));
                    }
                },
            },
            ExportDefaultDeclaration(path, state) {
                var _a;
                if (state.associate) {
                    return;
                }
                let template = getTemplate(path, state);
                if (!template) {
                    return;
                }
                let declaration = path.get('declaration').node;
                if (t.isClassDeclaration(declaration)) {
                    if (declaration.id != null) {
                        state.associate = { template, component: declaration.id };
                    }
                    else {
                        path.node.declaration = t.callExpression(setComponentTemplate(path, state), [
                            template,
                            t.classExpression(null, declaration.superClass, declaration.body, (_a = declaration.decorators) !== null && _a !== void 0 ? _a : []),
                        ]);
                    }
                }
                else if (t.isFunctionDeclaration(declaration)) {
                    if (declaration.id != null) {
                        state.associate = { template, component: declaration.id };
                    }
                    else {
                        path.node.declaration = t.callExpression(setComponentTemplate(path, state), [
                            template,
                            t.functionExpression(null, declaration.params, declaration.body, declaration.generator, declaration.async),
                        ]);
                    }
                }
                else if (t.isTSDeclareFunction(declaration)) {
                    // we don't rewrite this
                }
                else {
                    path.node.declaration = t.callExpression(setComponentTemplate(path, state), [template, declaration]);
                }
            },
            ExportNamedDeclaration(path, state) {
                if (state.associate) {
                    return;
                }
                let template = getTemplate(path, state);
                if (!template) {
                    return;
                }
                let { node } = path;
                for (let specifier of path.node.specifiers) {
                    if (t.isExportDefaultSpecifier(specifier)) {
                    }
                    else if (t.isExportSpecifier(specifier)) {
                        const name = specifier.exported.type === 'Identifier' ? specifier.exported.name : specifier.exported.value;
                        if (name === 'default') {
                            if (node.source) {
                                // our default export is a reexport from elsewhere. We will
                                // synthesize a new import for it so we can get a local handle
                                // on it
                                let component = state.adder.import(path, node.source.value, specifier.local.name, 'COMPONENT');
                                state.associate = { template, component };
                            }
                            else {
                                // our default export is one of our local names
                                state.associate = { template, component: t.identifier(specifier.local.name) };
                            }
                        }
                    }
                }
            },
        },
    };
}
function getTemplate(target, state) {
    if (state.colocatedTemplate) {
        return state.adder.import(target, (0, _1.explicitRelative)((0, path_1.dirname)(state.colocatedTemplate), state.colocatedTemplate), 'default', 'TEMPLATE');
    }
}
//# sourceMappingURL=template-colocation-plugin.js.map