import type Package from './package';
export declare function explicitRelative(fromDir: string, toFile: string): string;
export declare function extensionsPattern(extensions: string[]): RegExp;
export declare function unrelativize(pkg: Package, specifier: string, fromFile: string): string;
export declare function cleanUrl(url: string): string;
export declare function correspondingTemplate(filename: string): string;
