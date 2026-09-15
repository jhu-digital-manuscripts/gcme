import '../../../debug/index.js';
import calculateLocationDisplay from '../system/calculate-location-display.js';
import { trackLocals } from './utils.js';
import { isDevelopingApp } from '@embroider/macros';
import { assert } from '../../../debug/lib/assert.js';

function assertAgainstNamedOutlets(env) {
  let moduleName = env.meta?.moduleName;
  let {
    hasLocal,
    visitor
  } = trackLocals(env);
  return {
    name: 'assert-against-named-outlets',
    visitor: {
      ...visitor,
      MustacheStatement(node) {
        if (node.path.type === 'PathExpression' && node.path.original === 'outlet' && node.params[0] && !hasLocal('outlet')) {
          let sourceInformation = calculateLocationDisplay(moduleName, node.loc);
          (isDevelopingApp() && true && assert(`Named outlets were removed in Ember 4.0. See https://deprecations.emberjs.com/v3.x#toc_route-render-template for guidance on alternative APIs for named outlet use cases. ${sourceInformation}`));
        }
      }
    }
  };
}

export { assertAgainstNamedOutlets as default };
