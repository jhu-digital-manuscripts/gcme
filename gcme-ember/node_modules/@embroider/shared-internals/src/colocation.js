"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syntheticJStoHBS = syntheticJStoHBS;
exports.needsSyntheticComponentJS = needsSyntheticComponentJS;
exports.isInComponents = isInComponents;
exports.templateOnlyComponentSource = templateOnlyComponentSource;
const fs_extra_1 = require("fs-extra");
const paths_1 = require("./paths");
const path_1 = require("path");
const resolve_exports_1 = require("resolve.exports");
function syntheticJStoHBS(source) {
    // explicit js is the only case we care about here. Synthetic template JS is
    // only ever JS (never TS or anything else). And extensionless imports are
    // handled by the default resolving system doing extension search.
    if ((0, paths_1.cleanUrl)(source).endsWith('.js')) {
        return source.replace(/.js(\?.*)?$/, '.hbs$1');
    }
    return null;
}
function needsSyntheticComponentJS(requestedSpecifier, foundFile) {
    requestedSpecifier = (0, paths_1.cleanUrl)(requestedSpecifier);
    foundFile = (0, paths_1.cleanUrl)(foundFile);
    if (discoveredImplicitHBS(requestedSpecifier, foundFile) &&
        !foundFile.split(path_1.sep).join('/').endsWith('/template.hbs') &&
        !correspondingJSExists(foundFile)) {
        return foundFile.slice(0, -3) + 'js';
    }
    return null;
}
function discoveredImplicitHBS(source, id) {
    return !source.endsWith('.hbs') && id.endsWith('.hbs');
}
function correspondingJSExists(id) {
    return ['js', 'ts'].some(ext => (0, fs_extra_1.existsSync)(id.slice(0, -3) + ext));
}
function isInComponents(url, packageCache) {
    var _a;
    const id = (0, paths_1.cleanUrl)(url);
    const pkg = packageCache.ownerOfFile(id);
    if (!(pkg === null || pkg === void 0 ? void 0 : pkg.isApp())) {
        return false;
    }
    let tryResolve = (0, resolve_exports_1.resolve)(pkg.packageJSON, './components', {
        browser: true,
        conditions: ['default', 'imports'],
    });
    let componentsDir = (_a = tryResolve === null || tryResolve === void 0 ? void 0 : tryResolve[0]) !== null && _a !== void 0 ? _a : './components';
    return (0, paths_1.explicitRelative)(pkg.root, id).split(path_1.sep).join('/').startsWith(componentsDir);
}
function templateOnlyComponentSource() {
    return `import templateOnly from '@ember/component/template-only';\nexport default templateOnly();\n`;
}
//# sourceMappingURL=colocation.js.map