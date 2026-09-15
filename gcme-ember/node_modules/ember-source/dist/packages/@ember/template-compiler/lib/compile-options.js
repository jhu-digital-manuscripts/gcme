import '../../debug/index.js';
import { STRICT_MODE_KEYWORDS, STRICT_MODE_TRANSFORMS, RESOLUTION_MODE_TRANSFORMS } from './plugins/index.js';
import COMPONENT_NAME_SIMPLE_DASHERIZE_CACHE from './dasherize-component-name.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../debug/lib/assert.js';

let USER_PLUGINS = [];
function malformedComponentLookup(string) {
  return string.indexOf('::') === -1 && string.indexOf(':') > -1;
}
function buildCompileOptions(_options) {
  let moduleName = _options.moduleName;
  let options = {
    meta: {},
    isProduction: false,
    plugins: {
      ast: []
    },
    ..._options,
    moduleName,
    customizeComponentName(tagname) {
      (isDevelopingApp() && !(!malformedComponentLookup(tagname)) && assert(`You tried to invoke a component named <${tagname} /> in "${moduleName ?? '[NO MODULE]'}", but that is not a valid name for a component. Did you mean to use the "::" syntax for nested components?`, !malformedComponentLookup(tagname)));
      return COMPONENT_NAME_SIMPLE_DASHERIZE_CACHE.get(tagname);
    }
  };
  if ('eval' in options) {
    const localScopeEvaluator = options.eval;
    const globalScopeEvaluator = value => new Function(`return ${value};`)();
    options.lexicalScope = variable => {
      if (inScope(variable, localScopeEvaluator)) {
        return !inScope(variable, globalScopeEvaluator);
      }
      return false;
    };
    delete options.eval;
  }
  if ('scope' in options) {
    const scope = options.scope();
    options.lexicalScope = variable => variable in scope;
    delete options.scope;
  }
  if ('locals' in options && !options.locals) {
    // Glimmer's precompile options declare `locals` like:
    //    locals?: string[]
    // but many in-use versions of babel-plugin-htmlbars-inline-precompile will
    // set locals to `null`. This used to work but only because glimmer was
    // ignoring locals for non-strict templates, and now it supports that case.
    delete options.locals;
  }

  // move `moduleName` into `meta` property
  if (options.moduleName) {
    let meta = options.meta;
    (isDevelopingApp() && !(meta) && assert('has meta', meta)); // We just set it
    meta.moduleName = options.moduleName;
  }
  if (options.strictMode) {
    options.keywords = STRICT_MODE_KEYWORDS;
  }
  return options;
}
function transformsFor(options) {
  return options.strictMode ? STRICT_MODE_TRANSFORMS : RESOLUTION_MODE_TRANSFORMS;
}
function compileOptions(_options = {}) {
  let options = buildCompileOptions(_options);
  let builtInPlugins = transformsFor(options);
  if (!_options.plugins) {
    options.plugins = {
      ast: [...USER_PLUGINS, ...builtInPlugins]
    };
  } else {
    let potententialPugins = [...USER_PLUGINS, ...builtInPlugins];
    (isDevelopingApp() && !(options.plugins) && assert('expected plugins', options.plugins));
    let pluginsToAdd = potententialPugins.filter(plugin => {
      (isDevelopingApp() && !(options.plugins) && assert('expected plugins', options.plugins));
      return options.plugins.ast.indexOf(plugin) === -1;
    });
    options.plugins.ast = [...options.plugins.ast, ...pluginsToAdd];
  }
  return options;
}
// https://tc39.es/ecma262/2020/#prod-IdentifierName
const IDENT = /^[\p{ID_Start}$_][\p{ID_Continue}$_\u200C\u200D]*$/u;
function inScope(variable, evaluator) {
  // If the identifier is not a valid JS identifier, it's definitely not in scope
  if (!IDENT.exec(variable)) {
    return false;
  }
  try {
    return evaluator(`typeof ${variable} !== "undefined"`) === true;
  } catch (e) {
    // This occurs when attempting to evaluate a reserved word using eval (`eval('typeof let')`).
    // If the variable is a reserved word, it's definitely not in scope, so return false. Since
    // reserved words are somewhat contextual, we don't try to identify them purely by their
    // name. See https://tc39.es/ecma262/#sec-keywords-and-reserved-words
    if (e && e instanceof SyntaxError) {
      return false;
    }

    // If it's another kind of error, don't swallow it.
    throw e;
  }
}

export { compileOptions as default };
