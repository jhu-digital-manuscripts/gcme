"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewrittenPackageCache = void 0;
const package_cache_1 = __importDefault(require("./package-cache"));
const package_1 = __importDefault(require("./package"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const get_or_create_1 = require("./get-or-create");
const working_dir_1 = require("./working-dir");
class RewrittenPackageCache {
    constructor(plainCache) {
        this.plainCache = plainCache;
    }
    get appRoot() {
        return this.plainCache.appRoot;
    }
    resolve(packageName, fromPackage) {
        // check for any extraResolutions
        let extraResolutions = this.index.extraResolutions.get(fromPackage.root);
        if (extraResolutions) {
            for (let depRoot of extraResolutions) {
                let depPkg = this.plainCache.get(depRoot);
                if (depPkg.name === packageName) {
                    return this.maybeMoved(this.withRewrittenDeps(depPkg));
                }
            }
        }
        let resolveFromPkg;
        let oldRoot = this.index.newToOld.get(fromPackage.root);
        if (oldRoot) {
            // the requesting package has been moved, so do the resolving from the old location
            resolveFromPkg = this.plainCache.get(oldRoot);
        }
        else {
            // the requesting package has not been moved
            resolveFromPkg = fromPackage;
        }
        let oldDest = this.withRewrittenDeps(this.plainCache.resolve(packageName, resolveFromPkg));
        // if the package we found was itself moved return the moved one.
        return this.maybeMoved(oldDest);
    }
    // ensure we have the moved version of the package
    maybeMoved(pkg) {
        let newRoot = this.index.oldToNew.get(pkg.root);
        if (newRoot) {
            return this.get(newRoot);
        }
        else {
            return pkg;
        }
    }
    get(packageRoot) {
        return this.withRewrittenDeps(this.plainCache.get(packageRoot));
    }
    original(pkg) {
        let oldRoot = this.index.newToOld.get(pkg.root);
        if (oldRoot) {
            return this.withRewrittenDeps(this.plainCache.get(oldRoot));
        }
        else {
            return pkg;
        }
    }
    // given any package, give us a new representation of it where its deps are
    // replaced with rewritten versions of those deps, as needed
    withRewrittenDeps(pkg) {
        let found = wrapped.get(pkg);
        if (!found) {
            if (pkg.root === this.index.oldToNew.get(this.appRoot)) {
                // the plain representation of our moved app doesn't know that it's an
                // app, so we instead make a plain Package with isApp set to true
                // explicitly.
                found = new WrappedPackage(this, new package_1.default(pkg.root, this.plainCache, true));
            }
            else {
                found = new WrappedPackage(this, pkg);
            }
            wrapped.set(pkg, found);
        }
        return castToPackage(found);
    }
    ownerOfFile(filename) {
        let owner = this.plainCache.ownerOfFile(filename);
        if (owner) {
            return this.withRewrittenDeps(owner);
        }
    }
    get index() {
        if (!this.indexCache) {
            this.indexCache = this.loadIndex();
        }
        return this.indexCache;
    }
    invalidateIndex() {
        this.indexCache = undefined;
    }
    loadIndex() {
        let workingDir = (0, working_dir_1.locateEmbroiderWorkingDir)(this.appRoot);
        let indexFile = (0, path_1.resolve)(workingDir, 'rewritten-packages', 'index.json');
        if (!(0, fs_extra_1.existsSync)(indexFile)) {
            return {
                oldToNew: new Map(),
                newToOld: new Map(),
                extraResolutions: new Map(),
            };
        }
        workingDir = (0, fs_extra_1.realpathSync)(workingDir);
        let addonsDir = (0, path_1.resolve)(workingDir, 'rewritten-packages');
        let { packages, extraResolutions } = (0, fs_extra_1.readJSONSync)(indexFile);
        return {
            oldToNew: new Map(Object.entries(packages).map(([oldRoot, newRoot]) => [(0, path_1.resolve)(addonsDir, oldRoot), (0, path_1.resolve)(addonsDir, newRoot)])),
            newToOld: new Map(Object.entries(packages).map(([oldRoot, newRoot]) => [(0, path_1.resolve)(addonsDir, newRoot), (0, path_1.resolve)(addonsDir, oldRoot)])),
            extraResolutions: new Map(Object.entries(extraResolutions).map(([fromRoot, toRoots]) => [
                (0, path_1.resolve)(addonsDir, fromRoot),
                toRoots.map(r => (0, path_1.resolve)(addonsDir, r)),
            ])),
        };
    }
    static shared(identifier, appRoot) {
        let pk = (0, get_or_create_1.getOrCreate)(shared, identifier + appRoot, () => new RewrittenPackageCache(package_cache_1.default.shared(identifier, appRoot)));
        // it's not clear that this could ever happen because appRoot is part of the new identifier
        // but it doesn't cost much to leave this code here.
        if (pk.appRoot !== appRoot) {
            throw new Error(`bug: RewrittenPackageCache appRoot disagreement ${appRoot} != ${pk.appRoot}`);
        }
        return pk;
    }
}
exports.RewrittenPackageCache = RewrittenPackageCache;
const shared = new Map();
const wrapped = new WeakMap();
function castToPackage(m) {
    return m;
}
class WrappedPackage {
    // Questions about *this* package will be answered based on the given
    // plainPkg.
    //
    // Questions about *this package's deps* will be translated through the set of
    // moved packages.
    //
    // There are two different cases that this enables. The first is when we're
    // representing a package that has itself been rewritten, in which case
    // plainPkg points at the *rewritten* copy of the package, so that we see our
    // own rewritten package.json, etc. The second case is in Stage2 when the
    // dependencies have been rewritten but the app has not -- we represent the
    // app as a WrappedPackage where plainPkg is the *original* app package, so
    // we're still seeing the original package.json, etc, but while also seeing
    // the rewritten addons.
    constructor(packageCache, plainPkg) {
        this.packageCache = packageCache;
        this.plainPkg = plainPkg;
    }
    get root() {
        return this.plainPkg.root;
    }
    get name() {
        return this.plainPkg.name;
    }
    get version() {
        return this.plainPkg.version;
    }
    get packageJSON() {
        return this.plainPkg.packageJSON;
    }
    get meta() {
        return this.plainPkg.meta;
    }
    isEmberPackage() {
        return this.plainPkg.isEmberPackage();
    }
    isEngine() {
        return this.plainPkg.isEngine();
    }
    isLazyEngine() {
        return this.plainPkg.isLazyEngine();
    }
    isV2Ember() {
        return this.plainPkg.isV2Ember();
    }
    isV2App() {
        return this.plainPkg.isV2App();
    }
    isV2Addon() {
        return this.plainPkg.isV2Addon();
    }
    // it's important that we're calling this.dependencies here at this level, not
    // plainPkg.dependencies, which wouldn't be correct
    findDescendants(filter) {
        let pkgs = new Set();
        let queue = [castToPackage(this)];
        while (true) {
            let pkg = queue.shift();
            if (!pkg) {
                break;
            }
            if (!pkgs.has(pkg)) {
                pkgs.add(pkg);
                let nextLevel;
                if (filter) {
                    nextLevel = pkg.dependencies.filter(filter);
                }
                else {
                    nextLevel = pkg.dependencies;
                }
                nextLevel.forEach(d => queue.push(d));
            }
        }
        pkgs.delete(castToPackage(this));
        return [...pkgs.values()];
    }
    get mayRebuild() {
        return this.plainPkg.mayRebuild;
    }
    get dependencyNames() {
        return this.plainPkg.dependencyNames;
    }
    get dependencies() {
        return this.plainPkg.dependencyNames
            .map(name => {
            try {
                // this is going through the rewriting-aware resolve in
                // RewrittenPackageCache.
                let dep = this.packageCache.resolve(name, this.plainPkg);
                // and this ensures that regardless of whether the package we found
                // was itself moved, if any of its deps have moved it will see those
                // ones.
                return this.packageCache.withRewrittenDeps(dep);
            }
            catch (error) {
                // if the package was not found do not error out here. this is relevant
                // for the case where a package might be an optional peerDependency and we dont
                // want to error if it was not found. Additionally, erroring here is "far" away
                // from the actual logical failure point and so not failing here will provide a better
                // error message down the line
                if (error.code === 'MODULE_NOT_FOUND') {
                    return false;
                }
                throw error;
            }
        })
            .filter(Boolean);
    }
    hasDependency(name) {
        // this is *not* extended because it's understood that the rewritten package
        // should explictly list the things that need extraResolutions in its own
        // package.json.ß
        return this.plainPkg.hasDependency(name);
    }
    categorizeDependency(name) {
        return this.plainPkg.categorizeDependency(name);
    }
}
//# sourceMappingURL=rewritten-package-cache.js.map