import Package from './package';
export default class PackageCache {
    appRoot: string;
    constructor(appRoot: string);
    resolve(packageName: string, fromPackage: Package): Package;
    private rootCache;
    private resolutionCache;
    get(packageRoot: string): Package;
    ownerOfFile(filename: string): Package | undefined;
    static shared(identifier: string, appRoot: string): PackageCache;
}
