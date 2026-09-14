import type * as Babel from '@babel/core';
import { ExtendedPluginBuilder } from './js-utils';
import type { EmberTemplateCompiler } from './ember-template-compiler';
import { LegacyModuleName } from './public-types';
export * from './public-types';
export interface Options {
    compiler?: EmberTemplateCompiler;
    outputModuleOverrides?: Record<string, Record<string, [string, string]>>;
    enableLegacyModules?: LegacyModuleName[];
    targetFormat?: 'wire' | 'hbs';
    transforms?: ExtendedPluginBuilder[];
}
export declare function makePlugin<EnvSpecificOptions>(loadOptions: (opts: EnvSpecificOptions) => Options): (babel: typeof Babel) => Babel.PluginObj<unknown>;
declare const _default: (babel: typeof Babel) => Babel.PluginObj<unknown>;
export default _default;
