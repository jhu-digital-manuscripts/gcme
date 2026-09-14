/**
 * Given a list of files, it will return the smallest set of directories that contain all these files
 */
export declare function commonAncestorDirectories(dirs: string[]): string[];
/**
 * Given a path to a package, it will return all its internal(!) module files that are importable,
 * taking into account explicit package.json exports, filtered down to only include importable runtime code
 */
export declare function getImportableModules(packagePath: string): string[];
/**
 * Given a package path, it will return the list smallest set of directories that contain importable code.
 * This can be used to constrain the set of directories used for file watching, to not include the whole package directory.
 */
export declare function getWatchedDirectories(packagePath: string): string[];
