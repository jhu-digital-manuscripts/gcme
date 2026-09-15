"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locateEmbroiderWorkingDir = locateEmbroiderWorkingDir;
const path_1 = require("path");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const cache = new Map();
// Most of this only exists because of classic dummy apps being weird.
function locateEmbroiderWorkingDir(appRoot) {
    var _a;
    if (cache.has(appRoot)) {
        return cache.get(appRoot);
    }
    if (process.env.EMBROIDER_WORKING_DIRECTORY) {
        let path = (0, path_1.resolve)(appRoot, process.env.EMBROIDER_WORKING_DIRECTORY);
        return path;
    }
    else if ((0, fs_1.existsSync)((0, path_1.resolve)(appRoot, 'package.json'))) {
        // the normal case
        let path = (0, path_1.resolve)(appRoot, 'node_modules', '.embroider');
        cache.set(appRoot, path);
        return path;
    }
    else {
        // probably in a dummy app (sigh), but let's do a little checking to
        // distinguish that case from someone pointing embroider at a nonsense
        // location
        if ((0, fs_1.existsSync)((0, path_1.resolve)(appRoot, '..', '..', 'package.json'))) {
            let pkg = (0, fs_extra_1.readJSONSync)((0, path_1.resolve)(appRoot, '..', '..', 'package.json'));
            if ((_a = pkg.keywords) === null || _a === void 0 ? void 0 : _a.includes('ember-addon')) {
                let path = (0, path_1.resolve)(appRoot, '..', '..', 'node_modules', '.embroider');
                cache.set(appRoot, path);
                return path;
            }
        }
        throw new Error('unable to locate app');
    }
}
//# sourceMappingURL=working-dir.js.map