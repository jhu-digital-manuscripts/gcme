"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defer = void 0;
function defer() {
    let dfd = {};
    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
}
exports.defer = defer;
