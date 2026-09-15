"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = error;
function error(path, message) {
    // this typecast is to workaround an issue in @types/babel__traverse https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/67183
    return path.buildCodeFrameError(message, MacroError);
}
class MacroError extends Error {
    constructor(message) {
        super(message);
        this.type = '@embroider/macros Error';
        this.name = 'MacroError';
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
        else if (!this.stack) {
            this.stack = new Error(message).stack;
        }
    }
}
//# sourceMappingURL=error.js.map