import PackageCache, { type PackageCachePublicAPI } from './package-cache';
import Package from './package';
export interface RewrittenPackageIndex {
    packages: Record<string, string>;
    extraResolutions: Record<string, string[]>;
}
export declare class RewrittenPackageCache implements PackageCachePublicAPI {
    private plainCache;
    constructor(plainCache: PackageCache);
    get appRoot(): string;
    resolve(packageName: string, fromPackage: Package): Package;
    maybeMoved(pkg: Package): Package;
    get(packageRoot: string): Package;
    original(pkg: Package): Package;
    withRewrittenDeps(pkg: Package): Package;
    ownerOfFile(filename: string): Package | undefined;
    private indexCache;
    private get index();
    invalidateIndex(): void;
    private loadIndex;
    static shared(identifier: string, appRoot: string): RewrittenPackageCache;
}
