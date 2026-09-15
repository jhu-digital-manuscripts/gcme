"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shallowEqual = shallowEqual;
exports.stripQuery = stripQuery;
function shallowEqual(a, b) {
    return (a &&
        b &&
        a.length === b.length &&
        a.every((item, index) => item === b[index]));
}
function stripQuery(path) {
    return path.split('?')[0];
}
//# sourceMappingURL=util.js.map