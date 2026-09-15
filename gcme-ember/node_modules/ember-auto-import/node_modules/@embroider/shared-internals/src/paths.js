"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.explicitRelative = explicitRelative;
exports.extensionsPattern = extensionsPattern;
exports.unrelativize = unrelativize;
exports.cleanUrl = cleanUrl;
exports.correspondingTemplate = correspondingTemplate;
const path_1 = require("path");
// by "explicit", I mean that we want "./local/thing" instead of "local/thing"
// because
//     import "./local/thing"
// has a different meaning than
//     import "local/thing"
//
function explicitRelative(fromDir, toFile) {
    let result = (0, path_1.join)((0, path_1.relative)(fromDir, (0, path_1.dirname)(toFile)), (0, path_1.basename)(toFile));
    if (!(0, path_1.isAbsolute)(result) && !result.startsWith('.')) {
        result = './' + result;
    }
    if ((0, path_1.isAbsolute)(toFile) && result.split(path_1.sep).join('/').endsWith(toFile)) {
        // this prevents silly "relative" paths like
        // "../../../../../Users/you/projects/your/stuff" when we could have just
        // said "/Users/you/projects/your/stuff". The silly path isn't incorrect,
        // but it's unnecessarily verbose.
        return toFile;
    }
    // windows supports both kinds of path separators but webpack wants relative
    // paths to use forward slashes.
    return result.replace(/\\/g, '/');
}
// given a list like ['.js', '.ts'], return a regular expression for files ending
// in those extensions.
function extensionsPattern(extensions) {
    return new RegExp(`(${extensions.map(e => `${e.replace('.', '\\.')}`).join('|')})$`, 'i');
}
function unrelativize(pkg, specifier, fromFile) {
    if (pkg.packageJSON.exports) {
        throw new Error(`unsupported: engines cannot use package.json exports`);
    }
    let result = (0, path_1.resolve)((0, path_1.dirname)(fromFile), specifier).replace(pkg.root, pkg.name);
    if (path_1.sep !== '/') {
        result = result.split(path_1.sep).join('/');
    }
    return result;
}
const postfixRE = /[?#].*$/s;
// this is the same implementation Vite uses internally to keep its
// cache-busting query params from leaking where they shouldn't.
function cleanUrl(url) {
    return url.replace(postfixRE, '');
}
// given a filename, returns it with the hbs extension
// for instance, passing filename.js returns filename.hbs
function correspondingTemplate(filename) {
    let { ext } = (0, path_1.parse)(filename);
    return filename.slice(0, filename.length - ext.length) + '.hbs';
}
//# sourceMappingURL=paths.js.map