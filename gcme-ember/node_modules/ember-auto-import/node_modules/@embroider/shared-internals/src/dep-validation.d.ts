import type Package from './package';
export declare function crawlDeps(startingPackage: Package): Map<Package, Package[][]>;
interface PeerDepViolation {
    pkg: Package;
    dep: Package;
    ancestors: Package[];
    ancestor: Package;
    ancestorsDep: Package;
}
export declare function validatePeerDependencies(appPackage: Package): PeerDepViolation[];
export declare function summarizePeerDepViolations(violations: PeerDepViolation[]): string;
export {};
