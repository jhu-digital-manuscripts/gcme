"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hbsToJS = hbsToJS;
const js_string_escape_1 = __importDefault(require("js-string-escape"));
const path_1 = require("path");
function hbsToJS(hbsContents, options) {
    let optsSource = '';
    if (options === null || options === void 0 ? void 0 : options.filename) {
        let filename = options.filename;
        let { compatModuleNaming: renaming } = options;
        if (renaming) {
            if (filename.startsWith(renaming.rootDir)) {
                filename = renaming.modulePrefix + filename.slice(renaming.rootDir.length);
            }
            if (path_1.sep !== '/') {
                filename = filename.replace(/\\/g, '/');
            }
        }
        optsSource = `,{ moduleName: "${(0, js_string_escape_1.default)(filename)}" }`;
    }
    return [
        `import { precompileTemplate } from "@ember/template-compilation";`,
        `export default precompileTemplate("${(0, js_string_escape_1.default)(hbsContents)}"${optsSource})`,
    ].join('\n');
}
//# sourceMappingURL=hbs-to-js.js.map