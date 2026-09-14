import type * as t from '@babel/types';
import type * as Babel from '@babel/core';
export default function watermark(babel: {
    types: typeof t;
}): Babel.PluginObj;
