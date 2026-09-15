import { Options as SharedOptions } from './plugin';
import { EmberTemplateCompiler } from './ember-template-compiler';
import { ExtendedPluginBuilder } from './js-utils';
export * from './public-types';
export type Transform = ExtendedPluginBuilder | string | [string, unknown];
export type Options = Omit<SharedOptions, 'transforms' | 'compiler'> & {
    compilerPath?: string;
    compiler?: EmberTemplateCompiler;
    transforms?: Transform[];
};
declare const htmlbarsInlinePrecompile: (babel: typeof import("@babel/core")) => import("@babel/core").PluginObj<unknown>;
declare const _default: typeof htmlbarsInlinePrecompile & {
    baseDir(): string;
    _parallelBabel: {
        requireFile: string;
    };
};
export default _default;
