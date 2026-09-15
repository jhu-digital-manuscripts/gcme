"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlDeps = crawlDeps;
exports.validatePeerDependencies = validatePeerDependencies;
exports.summarizePeerDepViolations = summarizePeerDepViolations;
// For each package in the graph, discover all the paths to reach that package.
// That is, we're identifying all its consumers.
function crawlDeps(startingPackage) {
    let queue = [{ pkg: startingPackage, path: [] }];
    let seen = new Set();
    let results = new Map();
    for (;;) {
        let entry = queue.shift();
        if (!entry) {
            break;
        }
        let { pkg, path } = entry;
        let paths = results.get(pkg);
        if (paths) {
            paths.push(path);
        }
        else {
            results.set(pkg, [path]);
        }
        if (!seen.has(pkg)) {
            seen.add(pkg);
            for (let dep of pkg.dependencies) {
                if (pkg.categorizeDependency(dep.name) !== 'peerDependencies') {
                    queue.push({ pkg: dep, path: [...path, pkg] });
                }
            }
        }
    }
    return results;
}
function validatePeerDependencies(appPackage) {
    let violations = [];
    for (let [pkg, consumptions] of crawlDeps(appPackage)) {
        for (let dep of pkg.dependencies) {
            if (pkg.categorizeDependency(dep.name) === 'peerDependencies') {
                for (let ancestors of consumptions) {
                    for (let ancestor of ancestors.slice().reverse()) {
                        if (ancestor.hasDependency(dep.name)) {
                            let ancestorsDep = ancestor.dependencies.find(d => d.name === dep.name);
                            if (ancestorsDep !== dep && dep.isEmberPackage()) {
                                violations.push({ pkg, dep, ancestors, ancestor, ancestorsDep });
                            }
                            continue;
                        }
                    }
                }
            }
        }
    }
    return violations;
}
function summarizePeerDepViolations(violations) {
    let message = [];
    for (let { pkg, dep, ancestors, ancestor, ancestorsDep } of violations) {
        for (let [index, a] of ancestors.entries()) {
            message.push(packageIdSummary(a));
            if (index + 1 < ancestors.length) {
                message.push(displayConnection(a, ancestors[index + 1]));
            }
            else {
                message.push(displayConnection(a, pkg));
            }
        }
        message.push(packageIdSummary(pkg));
        message.push('\n');
        message.push(`    sees peerDep ${packageIdSummary(dep)}\n      at ${dep.root}\n`);
        message.push(`    but ${packageIdSummary(ancestor)} is using ${packageIdSummary(ancestorsDep)}\n      at ${ancestorsDep.root}\n\n`);
    }
    return message.join('');
}
function displayConnection(left, right) {
    var _a, _b, _c;
    if ((_a = left.packageJSON.dependencies) === null || _a === void 0 ? void 0 : _a[right.name]) {
        return ' -> ';
    }
    if ((_b = left.packageJSON.peerDependencies) === null || _b === void 0 ? void 0 : _b[right.name]) {
        return ' (peer)-> ';
    }
    if ((_c = left.packageJSON.devDependencies) === null || _c === void 0 ? void 0 : _c[right.name]) {
        return ' (dev)-> ';
    }
    return ' (?)-> ';
}
function packageIdSummary(pkg) {
    return `${pkg.name}@${pkg.version}`;
}
//# sourceMappingURL=dep-validation.js.map