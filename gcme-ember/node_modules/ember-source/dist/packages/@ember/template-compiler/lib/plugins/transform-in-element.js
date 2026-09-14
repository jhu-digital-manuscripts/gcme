import '../../../debug/index.js';
import { isPath } from './utils.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../debug/lib/assert.js';

function transformInElement(env) {
  let {
    builders: b
  } = env.syntax;
  return {
    name: 'transform-in-element',
    visitor: {
      BlockStatement(node) {
        if (!isPath(node.path)) return;
        if (node.path.original === 'in-element') {
          let originalValue = node.params[0];
          if (originalValue && !env.isProduction) {
            let subExpr = b.sexpr('-in-el-null', [originalValue]);
            node.params.shift();
            node.params.unshift(subExpr);
          }
          node.hash.pairs.forEach(pair => {
            if (pair.key === 'insertBefore') {
              (isDevelopingApp() && !(pair.value.type === 'NullLiteral' || pair.value.type === 'UndefinedLiteral') && assert(`Can only pass null to insertBefore in in-element, received: ${JSON.stringify(pair.value)}`, pair.value.type === 'NullLiteral' || pair.value.type === 'UndefinedLiteral'));
            }
          });
        }
      }
    }
  };
}

export { transformInElement as default };
