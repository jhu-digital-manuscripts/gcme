"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const package_1 = __importDefault(require("./package"));
const fs_1 = require("fs");
const get_or_create_1 = require("./get-or-create");
const resolve_package_path_1 = __importDefault(require("resolve-package-path"));
const path_1 = require("path");
const realpathSyncCache = new Map();
function getCachedRealpath(path) {
    let cached = realpathSyncCache.get(path);
    if (cached) {
        return cached;
    }
    let root = (0, fs_1.realpathSync)(path);
    realpathSyncCache.set(path, root);
    return root;
}
const existsCache = new Map();
function getCachedExists(path) {
    if (existsCache.has(path)) {
        const cachedExists = existsCache.get(path);
        if (cachedExists !== undefined) {
            return cachedExists;
        }
    }
    const exists = (0, fs_1.existsSync)(path);
    existsCache.set(path, exists);
    return exists;
}
class PackageCache {
    constructor(appRoot) {
        this.appRoot = appRoot;
        this.rootCache = new Map();
        this.resolutionCache = new Map();
    }
    resolve(packageName, fromPackage) {
        let cache = (0, get_or_create_1.getOrCreate)(this.resolutionCache, fromPackage, () => new Map());
        let result = (0, get_or_create_1.getOrCreate)(cache, packageName, () => {
            // the type cast is needed because resolvePackagePath itself is erroneously typed as `any`.
            let packagePath = (0, resolve_package_path_1.default)(packageName, fromPackage.root);
            if (!packagePath) {
                // this gets our null into the cache so we don't keep trying to resolve
                // a thing that is not found
                return null;
            }
            return this.get((0, path_1.dirname)(packagePath));
        });
        if (!result) {
            let e = new Error(`unable to resolve package ${packageName} from ${fromPackage.root}`);
            e.code = 'MODULE_NOT_FOUND';
            throw e;
        }
        return result;
    }
    get(packageRoot) {
        let root = getCachedRealpath(packageRoot);
        let p = (0, get_or_create_1.getOrCreate)(this.rootCache, root, () => {
            return new package_1.default(root, this, root === this.appRoot);
        });
        return p;
    }
    ownerOfFile(filename) {
        let candidate = filename;
        // first we look through our cached packages for any that are rooted right
        // at or above the file.
        while (true) {
            if ((0, path_1.basename)(candidate) === 'node_modules') {
                // once we hit a node_modules, we're leaving the
                // package we were in, so any higher caches don't apply to us
                break;
            }
            if (this.rootCache.has(candidate)) {
                return this.rootCache.get(candidate);
            }
            if (getCachedExists((0, path_1.join)(candidate, 'package.json'))) {
                return this.get(candidate);
            }
            let nextCandidate = (0, path_1.resolve)(candidate, '..');
            if (nextCandidate === candidate) {
                // got to the top
                break;
            }
            candidate = nextCandidate;
        }
    }
    static shared(identifier, appRoot) {
        let pk = (0, get_or_create_1.getOrCreate)(shared, identifier + appRoot, () => new PackageCache(appRoot));
        // it's not clear that this could ever happen because appRoot is part of the new identifier
        // but it doesn't cost much to leave this code here.
        if (pk.appRoot !== appRoot) {
            throw new Error(`bug: PackageCache appRoot disagreement ${appRoot}!=${pk.appRoot}`);
        }
        return pk;
    }
}
exports.default = PackageCache;
const shared = new Map();
//# sourceMappingURL=package-cache.js.map