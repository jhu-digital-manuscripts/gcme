"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = absolutePackageName;
const path_1 = require("path");
function absolutePackageName(specifier) {
    if (
    // relative paths:
    specifier[0] === '.' ||
        // webpack-specific microsyntax for internal requests:
        specifier[0] === '!' ||
        specifier[0] === '-' ||
        // absolute paths:
        (0, path_1.isAbsolute)(specifier)) {
        // Does not refer to a package
        return;
    }
    let parts = specifier.split('/');
    if (specifier[0] === '@') {
        return `${parts[0]}/${parts[1]}`;
    }
    else {
        return parts[0];
    }
}
//# sourceMappingURL=package-name.js.map