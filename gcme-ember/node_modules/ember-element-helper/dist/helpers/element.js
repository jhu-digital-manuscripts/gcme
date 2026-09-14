import EmberComponent from '@ember/component';
import Helper from '@ember/component/helper';
import { assert, runInDebug } from '@ember/debug';

function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function UNINITIALIZED() {}
class ElementHelper extends Helper {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "tagName", UNINITIALIZED);
    _defineProperty(this, "componentClass", void 0);
  }
  compute(params, hash) {
    assert('The `element` helper takes a single positional argument', params.length === 1);
    assert('The `element` helper does not take any named arguments', Object.keys(hash).length === 0);
    let tagName = params[0];
    if (tagName !== this.tagName) {
      this.tagName = tagName;
      if (typeof tagName === 'string') {
        this.componentClass = class DynamicElement extends EmberComponent {
          constructor(...args) {
            super(...args);
            _defineProperty(this, "tagName", tagName);
          }
        };
      } else {
        this.componentClass = undefined;
        runInDebug(() => {
          let message = 'The argument passed to the `element` helper must be a string';
          try {
            message += ` (you passed \`${tagName}\`)`;
          } catch (e) {
            // ignore
          }
          assert(message, tagName === undefined || tagName === null);
        });
      }
    }
    return this.componentClass;
  }
}

export { ElementHelper as default };
//# sourceMappingURL=element.js.map
