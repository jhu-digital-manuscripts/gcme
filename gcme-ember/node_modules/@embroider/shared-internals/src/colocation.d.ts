import type PackageCache from './package-cache';
export declare function syntheticJStoHBS(source: string): string | null;
export declare function needsSyntheticComponentJS(requestedSpecifier: string, foundFile: string): string | null;
export declare function isInComponents(url: string, packageCache: Pick<PackageCache, 'ownerOfFile'>): boolean;
export declare function templateOnlyComponentSource(): string;
