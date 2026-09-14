export interface Options {
    filename?: string;
    compatModuleNaming?: {
        rootDir: string;
        modulePrefix: string;
    };
}
export declare function hbsToJS(hbsContents: string, options?: Options): string;
