"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.version = exports.pluginPath = void 0;
exports.default = makePlugin;
const fs_extra_1 = require("fs-extra");
function makePlugin() {
    // Dear future @rwjblue,
    //
    // This plugin exists as a sentinel plugin which has no behavior, but
    // provides a position in the babel configuration to include cache busting
    // meta-data about other plugins. Specifically their versions.
    //
    // Yours sincerely,
    // Contributor
    return {};
}
exports.pluginPath = __filename;
exports.version = (0, fs_extra_1.readJSONSync)(`${__dirname}/../package.json`);
//# sourceMappingURL=babel-plugin-cache-busting.js.map