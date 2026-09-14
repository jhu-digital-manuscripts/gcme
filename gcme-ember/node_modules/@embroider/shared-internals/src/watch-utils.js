"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonAncestorDirectories = commonAncestorDirectories;
exports.getImportableModules = getImportableModules;
exports.getWatchedDirectories = getWatchedDirectories;
const is_subdir_1 = __importDefault(require("is-subdir"));
const path_1 = require("path");
const pkg_entry_points_1 = require("pkg-entry-points");
/**
 * Given a list of files, it will return the smallest set of directories that contain all these files
 */
function commonAncestorDirectories(dirs) {
    return dirs.reduce((results, fileOrDir) => {
        let dir = (0, path_1.dirname)(fileOrDir);
        if (results.length === 0) {
            return [dir];
        }
        let newResults = results.filter(existingDir => !(0, is_subdir_1.default)(dir, existingDir));
        if (!newResults.some(existingDir => (0, is_subdir_1.default)(existingDir, dir))) {
            newResults.push(dir);
        }
        return newResults;
    }, []);
}
/**
 * Given a path to a package, it will return all its internal(!) module files that are importable,
 * taking into account explicit package.json exports, filtered down to only include importable runtime code
 */
function getImportableModules(packagePath) {
    const entryPoints = (0, pkg_entry_points_1.getPackageEntryPointsSync)(packagePath);
    return Object.values(entryPoints)
        .map(alternatives => {
        var _a;
        return (_a = alternatives.find(([conditions]) => (conditions.includes('import') || conditions.includes('default')) &&
            !conditions.includes('types') &&
            !conditions.includes('require') &&
            !conditions.includes('node'))) === null || _a === void 0 ? void 0 : _a[1];
    })
        .filter((item) => !!item)
        .filter((item, index, array) => array.indexOf(item) === index);
}
/**
 * Given a package path, it will return the list smallest set of directories that contain importable code.
 * This can be used to constrain the set of directories used for file watching, to not include the whole package directory.
 */
function getWatchedDirectories(packagePath) {
    const modules = getImportableModules(packagePath).filter(module => 
    // this is a workaround for excluding the addon-main.cjs module commonly used in v2 addons, which is _not_ importable in runtime code,
    // but the generic logic based on (conditional) exports does not exclude that out of the box.
    !module.match(/\/addon-main.c?js$/));
    return commonAncestorDirectories(modules);
}
//# sourceMappingURL=watch-utils.js.map