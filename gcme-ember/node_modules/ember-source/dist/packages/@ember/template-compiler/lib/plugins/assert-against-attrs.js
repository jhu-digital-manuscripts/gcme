import { deprecate } from '../../../debug/index.js';
import calculateLocationDisplay from '../system/calculate-location-display.js';
import { trackLocals } from './utils.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../debug/lib/assert.js';

function assertAgainstAttrs(env) {
  let {
    builders: b
  } = env.syntax;
  let moduleName = env.meta?.moduleName;
  let {
    hasLocal,
    visitor
  } = trackLocals(env);
  return {
    name: 'assert-against-attrs',
    visitor: {
      ...visitor,
      PathExpression(node) {
        if (isAttrs(node, hasLocal)) {
          (isDevelopingApp() && true && assert(`Using {{attrs}} to reference named arguments is not supported. {{${node.original}}} should be updated to {{@${node.original.slice(6)}}}. ${calculateLocationDisplay(moduleName, node.loc)}`));
        } else if (isThisDotAttrs(node)) {
          // When removing this, ensure `{{this.attrs.foo}}` is left as-is, without triggering
          // any assertions/deprecations. It's perfectly legal to reference `{{this.attrs.foo}}`
          // in the template since it is a real property on the backing class – it will give you
          // a `MutableCell` wrapper object, but maybe that's what you want. And in any case,
          // there is no compelling to special case that property access.
          (isDevelopingApp() && true && deprecate(`Using {{this.attrs}} to reference named arguments has been deprecated. {{${node.original}}} should be updated to {{@${node.original.slice(11)}}}. ${calculateLocationDisplay(moduleName, node.loc)}`, false, {
            id: 'attrs-arg-access',
            url: 'https://deprecations.emberjs.com/v3.x/#toc_attrs-arg-access',
            until: '6.0.0',
            for: 'ember-source',
            since: {
              available: '3.26.0',
              enabled: '3.26.0'
            }
          }));
          return b.path(`@${node.original.slice(11)}`, node.loc);
        }
      }
    }
  };
}
function isAttrs(node, hasLocal) {
  return node.head.type === 'VarHead' && node.head.name === 'attrs' && !hasLocal(node.head.name);
}
function isThisDotAttrs(node) {
  return node.head.type === 'ThisHead' && node.tail[0] === 'attrs';
}

export { assertAgainstAttrs as default };
