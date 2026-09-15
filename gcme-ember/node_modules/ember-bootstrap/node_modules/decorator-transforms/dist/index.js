import {
  globalId
} from "./chunk-P25EBXNA.js";
import "./chunk-CSAU5B4Q.js";

// src/index.ts
import { createRequire } from "module";
import { ImportUtil } from "babel-import-util";
var req = createRequire(import.meta.url);
var { default: decoratorSyntax } = req("@babel/plugin-syntax-decorators");
function legacyDecoratorCompat(babel) {
  const t = babel.types;
  return {
    inherits: (api, _options, dirname) => decoratorSyntax(api, { legacy: true }, dirname),
    visitor: {
      Program(path, state) {
        state.currentClassBodies = [];
        state.currentObjectExpressions = [];
        state.optsWithDefaults = {
          runtime: "globals",
          staticBlock: "native",
          ...state.opts
        };
        let importUtil = new ImportUtil(t, path);
        state.runtime = (target, fnName) => {
          const { runtime } = state.optsWithDefaults;
          if (runtime === "globals") {
            return t.memberExpression(
              t.identifier(globalId),
              t.identifier(fnName)
            );
          } else {
            return importUtil.import(target, runtime.import, fnName);
          }
        };
      },
      ClassBody: {
        enter(path, state) {
          state.currentClassBodies.unshift(path.node);
        },
        exit(_path, state) {
          state.currentClassBodies.shift();
        }
      },
      ClassExpression(path, state) {
        let decorators = path.get("decorators");
        if (Array.isArray(decorators) && decorators.length > 0) {
          let call = t.expressionStatement(
            t.callExpression(state.runtime(path, "c"), [
              path.node,
              t.arrayExpression(
                decorators.slice().reverse().map((d) => d.node.expression)
              )
            ])
          );
          for (let decorator of decorators) {
            decorator.remove();
          }
          path.replaceWith(call);
        }
      },
      ClassDeclaration(path, state) {
        let decorators = path.get("decorators");
        if (Array.isArray(decorators) && decorators.length > 0) {
          let call = t.callExpression(state.runtime(path, "c"), [
            t.classExpression(
              path.node.id,
              path.node.superClass,
              path.node.body,
              []
              // decorators removed here
            ),
            t.arrayExpression(
              decorators.slice().reverse().map((d) => d.node.expression)
            )
          ]);
          if (path.parentPath.isExportDefaultDeclaration()) {
            let id = path.node.id;
            if (id) {
              path.parentPath.insertBefore(
                t.variableDeclaration("const", [t.variableDeclarator(id, call)])
              );
              path.parentPath.replaceWith(t.exportDefaultDeclaration(id));
            } else {
              path.parentPath.replaceWith(t.exportDefaultDeclaration(call));
            }
          } else if (path.parentPath.isExportNamedDeclaration()) {
            let id = path.node.id;
            if (!id) {
              throw new Error(
                `bug: expected a class name is required in this context`
              );
            }
            path.parentPath.insertBefore(
              t.variableDeclaration("const", [t.variableDeclarator(id, call)])
            );
            path.parentPath.replaceWith(
              t.exportNamedDeclaration(null, [t.exportSpecifier(id, id)])
            );
          } else {
            let id = path.node.id;
            if (!id) {
              throw new Error(
                `bug: expected a class name is required in this context`
              );
            }
            path.replaceWith(
              t.variableDeclaration("const", [t.variableDeclarator(id, call)])
            );
          }
        }
      },
      ClassProperty(path, state) {
        let decorators = path.get("decorators");
        if (Array.isArray(decorators) && decorators.length > 0) {
          let prototype;
          if (path.node.static) {
            prototype = t.identifier("this");
          } else {
            prototype = t.memberExpression(
              t.identifier("this"),
              t.identifier("prototype")
            );
          }
          let args = [
            prototype,
            valueForFieldKey(t, path.node.key),
            t.arrayExpression(
              decorators.slice().reverse().map((d) => d.node.expression)
            )
          ];
          if (path.node.value) {
            args.push(
              t.functionExpression(
                null,
                [],
                t.blockStatement([t.returnStatement(path.node.value)])
              )
            );
          }
          path.insertBefore(
            compatStaticBlock(
              state,
              t,
              path.node.key,
              t.callExpression(state.runtime(path, "g"), args)
            )
          );
          path.insertBefore(
            t.classPrivateProperty(
              t.privateName(
                t.identifier(
                  unusedPrivateNameLike(state, propName(path.node.key))
                )
              ),
              t.sequenceExpression([
                t.callExpression(state.runtime(path, "i"), [
                  t.identifier("this"),
                  valueForFieldKey(t, path.node.key)
                ]),
                t.identifier("void 0")
              ])
            )
          );
          path.remove();
        }
      },
      ClassMethod(path, state) {
        let decorators = path.get("decorators");
        if (Array.isArray(decorators) && decorators.length > 0) {
          let prototype;
          if (path.node.static) {
            prototype = t.identifier("this");
          } else {
            prototype = t.memberExpression(
              t.identifier("this"),
              t.identifier("prototype")
            );
          }
          path.insertAfter(
            compatStaticBlock(
              state,
              t,
              path.node.key,
              t.callExpression(state.runtime(path, "n"), [
                prototype,
                valueForFieldKey(t, path.node.key),
                t.arrayExpression(
                  decorators.slice().reverse().map((d) => d.node.expression)
                )
              ])
            )
          );
          for (let decorator of decorators) {
            decorator.remove();
          }
        }
      },
      ObjectExpression: {
        enter(_path, state) {
          state.currentObjectExpressions.unshift({
            decorated: []
          });
        },
        exit(path, state) {
          let { decorated } = state.currentObjectExpressions.shift();
          if (decorated.length > 0) {
            path.replaceWith(
              t.callExpression(state.runtime(path, "p"), [
                path.node,
                t.arrayExpression(
                  decorated.map(
                    ([type, prop, decorators]) => t.arrayExpression([
                      t.stringLiteral(type),
                      prop,
                      t.arrayExpression(decorators)
                    ])
                  )
                )
              ])
            );
          }
        }
      },
      ObjectProperty(path, state) {
        let decorators = path.get("decorators");
        if (Array.isArray(decorators) && decorators.length > 0) {
          if (state.currentObjectExpressions.length === 0) {
            throw new Error(
              `bug in decorator-transforms: didn't expect to see ObjectProperty outside ObjectExpression`
            );
          }
          let prop = path.node.key;
          if (prop.type === "PrivateName") {
            throw new Error(`cannot decorate private field`);
          }
          state.currentObjectExpressions[0].decorated.push([
            "field",
            valueForFieldKey(t, prop),
            decorators.slice().reverse().map((d) => d.node.expression)
          ]);
          for (let decorator of decorators) {
            decorator.remove();
          }
        }
      },
      ObjectMethod(path, state) {
        let decorators = path.get("decorators");
        if (Array.isArray(decorators) && decorators.length > 0) {
          if (state.currentObjectExpressions.length === 0) {
            throw new Error(
              `bug in decorator-transforms: didn't expect to see ObjectMethod outside ObjectExpression`
            );
          }
          let prop = path.node.key;
          state.currentObjectExpressions[0].decorated.push([
            "method",
            valueForFieldKey(t, prop),
            decorators.slice().reverse().map((d) => d.node.expression)
          ]);
          for (let decorator of decorators) {
            decorator.remove();
          }
        }
      }
    }
  };
}
function unusedPrivateNameLike(state, name) {
  let classBody = state.currentClassBodies[0];
  if (!classBody) {
    throw new Error(
      `bug: no current class body around our class field decorator`
    );
  }
  let usedNames = /* @__PURE__ */ new Set();
  for (let element of classBody.body) {
    if ((element.type === "ClassPrivateProperty" || element.type === "ClassPrivateMethod" || element.type === "ClassAccessorProperty") && element.key.type === "PrivateName") {
      usedNames.add(element.key.id.name);
    }
  }
  let candidate = name;
  while (usedNames.has(candidate)) {
    candidate = candidate + "_";
  }
  return candidate;
}
function propName(expr) {
  if (expr.type === "Identifier") {
    return expr.name;
  }
  if (expr.type === "BigIntLiteral" || expr.type === "NumericLiteral") {
    return `_${expr.value}`;
  }
  if (expr.type === "StringLiteral") {
    return "_" + expr.value.replace(/[^a-zA-Z]/g, "");
  }
  return "_";
}
function valueForFieldKey(t, expr) {
  if (expr.type === "Identifier") {
    return t.stringLiteral(expr.name);
  }
  return expr;
}
function compatStaticBlock(state, t, key, expression) {
  if (state.optsWithDefaults.staticBlock === "native") {
    return t.staticBlock([t.expressionStatement(expression)]);
  } else {
    return t.classPrivateProperty(
      t.privateName(t.identifier(unusedPrivateNameLike(state, propName(key)))),
      expression,
      null,
      true
    );
  }
}
export {
  legacyDecoratorCompat as default
};
//# sourceMappingURL=index.js.map