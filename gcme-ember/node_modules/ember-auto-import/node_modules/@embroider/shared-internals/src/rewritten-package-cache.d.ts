import PackageCache from './package-cache';
import Package from './package';
export interface RewrittenPackageIndex {
    packages: Record<string, string>;
    extraResolutions: Record<string, string[]>;
}
type PublicAPI<T> = {
    [K in keyof T]: T[K];
};
export declare class RewrittenPackageCache implements PublicAPI<PackageCache> {
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
export {};
