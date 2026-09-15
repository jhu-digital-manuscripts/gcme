"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugBundler = debugBundler;
const broccoli_debug_1 = __importDefault(require("broccoli-debug"));
const debugTree = broccoli_debug_1.default.buildDebugCallback('ember-auto-import');
// a Bundler is a broccoli transform node that also has an added property, so to
// wrap it in broccoli-debug we need a little extra work
function debugBundler(bundler, label) {
    let outputTree = debugTree(bundler, label);
    if (outputTree !== bundler) {
        Object.defineProperty(outputTree, 'buildResult', {
            get() {
                return bundler.buildResult;
            },
        });
    }
    return outputTree;
}
//# sourceMappingURL=bundler.js.map