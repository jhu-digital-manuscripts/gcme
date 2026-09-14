"use strict";
/*
  This class exists because:
   - before template compilation starts, we need to pass a `locals` array to
     ember-template-compiler
   - the JSUtils API can mutate the scope during template compilation
   - those scope mutations need to update both the original `locals` array and
     our own name mapping, keeping them in sync.
*/
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ScopeLocals_instances, _ScopeLocals_mapping, _ScopeLocals_locals, _ScopeLocals_params, _ScopeLocals_isInJsScope;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopeLocals = exports.ALLOWED_GLOBALS = void 0;
const hbs_utils_1 = require("./hbs-utils");
const read_only_array_1 = require("./read-only-array");
/**
 * RFC: https://github.com/emberjs/rfcs/pull/1070
 *
 * Criteria for inclusion in this list:
 *
 *   Any of:
 *     - begins with an uppercase letter
 *     - guaranteed to never be added to glimmer as a keyword (e.g.: globalThis)
 *
 *   And:
 *     - must not need new to invoke
 *     - must not require lifetime management (e.g.: setTimeout)
 *     - must not be a single-word lower-case API, because of potential collision with future new HTML elements
 *     - if the API is a function, the return value should not be a promise
 *     - must be one one of these lists:
 *        - https://tc39.es/ecma262/#sec-global-object
 *        - https://tc39.es/ecma262/#sec-function-properties-of-the-global-object
 *        - https://html.spec.whatwg.org/multipage/nav-history-apis.html#window
 *        - https://html.spec.whatwg.org/multipage/indices.html#all-interfaces
 *        - https://html.spec.whatwg.org/multipage/webappapis.html
 */
exports.ALLOWED_GLOBALS = new Set([
    // ////////////////
    // namespaces
    // ////////////////
    //   TC39
    'globalThis',
    'Atomics',
    'JSON',
    'Math',
    'Reflect',
    //   WHATWG
    'localStorage',
    'sessionStorage',
    // ////////////////
    // functions / utilities
    // ////////////////
    //   TC39
    'isNaN',
    'isFinite',
    'parseInt',
    'parseFloat',
    'decodeURI',
    'decodeURIComponent',
    'encodeURI',
    'encodeURIComponent',
    //   WHATWG
    'postMessage',
    'structuredClone',
    // ////////////////
    // new-less Constructors (still functions)
    // ////////////////
    //   TC39
    'Array', // different behavior from (array)
    'BigInt',
    'Boolean',
    'Date',
    'Number',
    'Object', // different behavior from (hash)
    'String',
    // ////////////////
    // Values
    // ////////////////
    //   TC39
    'Infinity',
    'NaN',
    //   WHATWG
    'isSecureContext',
]);
class ScopeLocals {
    constructor(params) {
        _ScopeLocals_instances.add(this);
        _ScopeLocals_mapping.set(this, {});
        _ScopeLocals_locals.set(this, []);
        _ScopeLocals_params.set(this, void 0);
        __classPrivateFieldSet(this, _ScopeLocals_params, params, "f");
    }
    get locals() {
        return (0, read_only_array_1.readOnlyArray)(__classPrivateFieldGet(this, _ScopeLocals_locals, "f"), 'The only supported way to manipulate locals is via the jsutils API\nhttps://github.com/emberjs/babel-plugin-ember-template-compilation#jsutils-manipulating-javascript-from-within-ast-transforms');
    }
    has(key) {
        return key in __classPrivateFieldGet(this, _ScopeLocals_mapping, "f");
    }
    get(key) {
        return __classPrivateFieldGet(this, _ScopeLocals_mapping, "f")[key];
    }
    isEmpty() {
        return __classPrivateFieldGet(this, _ScopeLocals_locals, "f").length === 0;
    }
    entries() {
        return Object.entries(__classPrivateFieldGet(this, _ScopeLocals_mapping, "f"));
    }
    add(hbsName, jsName) {
        __classPrivateFieldGet(this, _ScopeLocals_mapping, "f")[hbsName] = jsName !== null && jsName !== void 0 ? jsName : hbsName;
        if (!__classPrivateFieldGet(this, _ScopeLocals_locals, "f").includes(hbsName)) {
            __classPrivateFieldGet(this, _ScopeLocals_locals, "f").push(hbsName);
        }
    }
    // this AST transform discovers all possible upvars in HBS that refer to valid
    // bindings in JS, and then depending on the mode adjusts our actual scope bag
    // contents.
    crawl() {
        return (_env) => {
            let seen;
            return {
                name: 'scope-locals-crawl',
                visitor: {
                    Template: {
                        enter: () => {
                            seen = new Set();
                        },
                        exit: (_node, _path) => {
                            if (__classPrivateFieldGet(this, _ScopeLocals_params, "f").mode === 'implicit') {
                                // all hbs upvars that have matching JS bindings go into the
                                // scope
                                for (let name of seen) {
                                    if (name === 'this') {
                                        if (__classPrivateFieldGet(this, _ScopeLocals_params, "f").mayUseLexicalThis) {
                                            this.add(name);
                                        }
                                    }
                                    else if (__classPrivateFieldGet(this, _ScopeLocals_instances, "m", _ScopeLocals_isInJsScope).call(this, name, __classPrivateFieldGet(this, _ScopeLocals_params, "f").jsPath)) {
                                        this.add(name);
                                    }
                                }
                            }
                            else {
                                // in explicit form, we might prune back the preexising scope in
                                // the case where another AST transform has eliminated the use
                                // of the original binding. But we don't add anything new. The
                                // only way for new bindings to be introduced into scope is for
                                // another AST transform to explicitly call the jsutils, which
                                // calls our `add`.
                                for (let name of Object.keys(__classPrivateFieldGet(this, _ScopeLocals_mapping, "f"))) {
                                    if (!seen.has(name)) {
                                        __classPrivateFieldGet(this, _ScopeLocals_locals, "f").splice(__classPrivateFieldGet(this, _ScopeLocals_locals, "f").indexOf(name), 1);
                                        delete __classPrivateFieldGet(this, _ScopeLocals_mapping, "f")[name];
                                    }
                                }
                            }
                        },
                    },
                    PathExpression: (node, path) => {
                        switch (node.head.type) {
                            case 'ThisHead':
                                if (!(0, hbs_utils_1.astNodeHasBinding)(path, 'this')) {
                                    seen.add('this');
                                }
                                break;
                            case 'VarHead': {
                                const name = node.head.name;
                                if (!(0, hbs_utils_1.astNodeHasBinding)(path, name)) {
                                    seen.add(name);
                                }
                            }
                        }
                    },
                    ElementNode: (node, path) => {
                        const name = node.tag.split('.')[0];
                        if (!(0, hbs_utils_1.astNodeHasBinding)(path, name)) {
                            seen.add(name);
                        }
                    },
                },
            };
        };
    }
}
exports.ScopeLocals = ScopeLocals;
_ScopeLocals_mapping = new WeakMap(), _ScopeLocals_locals = new WeakMap(), _ScopeLocals_params = new WeakMap(), _ScopeLocals_instances = new WeakSet(), _ScopeLocals_isInJsScope = function _ScopeLocals_isInJsScope(hbsName, jsPath) {
    var _a;
    let jsName = (_a = __classPrivateFieldGet(this, _ScopeLocals_mapping, "f")[hbsName]) !== null && _a !== void 0 ? _a : hbsName;
    return exports.ALLOWED_GLOBALS.has(jsName) || jsPath.scope.getBinding(jsName);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcGUtbG9jYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NvcGUtbG9jYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztFQU9FOzs7Ozs7Ozs7Ozs7Ozs7QUFJRiwyQ0FBZ0Q7QUFDaEQsdURBQWtEO0FBRWxEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNVLFFBQUEsZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDO0lBQ3JDLG1CQUFtQjtJQUNuQixhQUFhO0lBQ2IsbUJBQW1CO0lBQ25CLFNBQVM7SUFDVCxZQUFZO0lBQ1osU0FBUztJQUNULE1BQU07SUFDTixNQUFNO0lBQ04sU0FBUztJQUNULFdBQVc7SUFDWCxjQUFjO0lBQ2QsZ0JBQWdCO0lBQ2hCLG1CQUFtQjtJQUNuQix3QkFBd0I7SUFDeEIsbUJBQW1CO0lBQ25CLFNBQVM7SUFDVCxPQUFPO0lBQ1AsVUFBVTtJQUNWLFVBQVU7SUFDVixZQUFZO0lBQ1osV0FBVztJQUNYLG9CQUFvQjtJQUNwQixXQUFXO0lBQ1gsb0JBQW9CO0lBQ3BCLFdBQVc7SUFDWCxhQUFhO0lBQ2IsaUJBQWlCO0lBQ2pCLG1CQUFtQjtJQUNuQiwwQ0FBMEM7SUFDMUMsbUJBQW1CO0lBQ25CLFNBQVM7SUFDVCxPQUFPLEVBQUUsa0NBQWtDO0lBQzNDLFFBQVE7SUFDUixTQUFTO0lBQ1QsTUFBTTtJQUNOLFFBQVE7SUFDUixRQUFRLEVBQUUsaUNBQWlDO0lBQzNDLFFBQVE7SUFDUixtQkFBbUI7SUFDbkIsU0FBUztJQUNULG1CQUFtQjtJQUNuQixTQUFTO0lBQ1QsVUFBVTtJQUNWLEtBQUs7SUFDTCxXQUFXO0lBQ1gsaUJBQWlCO0NBQ2xCLENBQUMsQ0FBQztBQXNCSCxNQUFhLFdBQVc7SUFDdEIsWUFBWSxNQUFjOztRQUkxQiwrQkFBbUMsRUFBRSxFQUFDO1FBQ3RDLDhCQUFvQixFQUFFLEVBQUM7UUFDdkIsc0NBQWdCO1FBTGQsdUJBQUEsSUFBSSx1QkFBVyxNQUFNLE1BQUEs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QUMsbUNBQUksT0FBTyxDQUFDO0lBQy9DLE9BQU8sdUJBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDeEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gIFRoaXMgY2xhc3MgZXhpc3RzIGJlY2F1c2U6XG4gICAtIGJlZm9yZSB0ZW1wbGF0ZSBjb21waWxhdGlvbiBzdGFydHMsIHdlIG5lZWQgdG8gcGFzcyBhIGBsb2NhbHNgIGFycmF5IHRvXG4gICAgIGVtYmVyLXRlbXBsYXRlLWNvbXBpbGVyXG4gICAtIHRoZSBKU1V0aWxzIEFQSSBjYW4gbXV0YXRlIHRoZSBzY29wZSBkdXJpbmcgdGVtcGxhdGUgY29tcGlsYXRpb25cbiAgIC0gdGhvc2Ugc2NvcGUgbXV0YXRpb25zIG5lZWQgdG8gdXBkYXRlIGJvdGggdGhlIG9yaWdpbmFsIGBsb2NhbHNgIGFycmF5IGFuZFxuICAgICBvdXIgb3duIG5hbWUgbWFwcGluZywga2VlcGluZyB0aGVtIGluIHN5bmMuXG4qL1xuXG5pbXBvcnQgdHlwZSB7IE5vZGVQYXRoIH0gZnJvbSAnQGJhYmVsL3RyYXZlcnNlJztcbmltcG9ydCB0eXBlIHsgQVNUUGx1Z2luRW52aXJvbm1lbnQsIE5vZGVWaXNpdG9yIH0gZnJvbSAnQGdsaW1tZXIvc3ludGF4JztcbmltcG9ydCB7IGFzdE5vZGVIYXNCaW5kaW5nIH0gZnJvbSAnLi9oYnMtdXRpbHMnO1xuaW1wb3J0IHsgcmVhZE9ubHlBcnJheSB9IGZyb20gJy4vcmVhZC1vbmx5LWFycmF5JztcblxuLyoqXG4gKiBSRkM6IGh0dHBzOi8vZ2l0aHViLmNvbS9lbWJlcmpzL3JmY3MvcHVsbC8xMDcwXG4gKlxuICogQ3JpdGVyaWEgZm9yIGluY2x1c2lvbiBpbiB0aGlzIGxpc3Q6XG4gKlxuICogICBBbnkgb2Y6XG4gKiAgICAgLSBiZWdpbnMgd2l0aCBhbiB1cHBlcmNhc2UgbGV0dGVyXG4gKiAgICAgLSBndWFyYW50ZWVkIHRvIG5ldmVyIGJlIGFkZGVkIHRvIGdsaW1tZXIgYXMgYSBrZXl3b3JkIChlLmcuOiBnbG9iYWxUaGlzKVxuICpcbiAqICAgQW5kOlxuICogICAgIC0gbXVzdCBub3QgbmVlZCBuZXcgdG8gaW52b2tlXG4gKiAgICAgLSBtdXN0IG5vdCByZXF1aXJlIGxpZmV0aW1lIG1hbmFnZW1lbnQgKGUuZy46IHNldFRpbWVvdXQpXG4gKiAgICAgLSBtdXN0IG5vdCBiZSBhIHNpbmdsZS13b3JkIGxvd2VyLWNhc2UgQVBJLCBiZWNhdXNlIG9mIHBvdGVudGlhbCBjb2xsaXNpb24gd2l0aCBmdXR1cmUgbmV3IEhUTUwgZWxlbWVudHNcbiAqICAgICAtIGlmIHRoZSBBUEkgaXMgYSBmdW5jdGlvbiwgdGhlIHJldHVybiB2YWx1ZSBzaG91bGQgbm90IGJlIGEgcHJvbWlzZVxuICogICAgIC0gbXVzdCBiZSBvbmUgb25lIG9mIHRoZXNlIGxpc3RzOlxuICogICAgICAgIC0gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3NlYy1nbG9iYWwtb2JqZWN0XG4gKiAgICAgICAgLSBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jc2VjLWZ1bmN0aW9uLXByb3BlcnRpZXMtb2YtdGhlLWdsb2JhbC1vYmplY3RcbiAqICAgICAgICAtIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL25hdi1oaXN0b3J5LWFwaXMuaHRtbCN3aW5kb3dcbiAqICAgICAgICAtIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZGljZXMuaHRtbCNhbGwtaW50ZXJmYWNlc1xuICogICAgICAgIC0gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvd2ViYXBwYXBpcy5odG1sXG4gKi9cbmV4cG9ydCBjb25zdCBBTExPV0VEX0dMT0JBTFMgPSBuZXcgU2V0KFtcbiAgLy8gLy8vLy8vLy8vLy8vLy8vL1xuICAvLyBuYW1lc3BhY2VzXG4gIC8vIC8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICBUQzM5XG4gICdnbG9iYWxUaGlzJyxcbiAgJ0F0b21pY3MnLFxuICAnSlNPTicsXG4gICdNYXRoJyxcbiAgJ1JlZmxlY3QnLFxuICAvLyAgIFdIQVRXR1xuICAnbG9jYWxTdG9yYWdlJyxcbiAgJ3Nlc3Npb25TdG9yYWdlJyxcbiAgLy8gLy8vLy8vLy8vLy8vLy8vL1xuICAvLyBmdW5jdGlvbnMgLyB1dGlsaXRpZXNcbiAgLy8gLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgIFRDMzlcbiAgJ2lzTmFOJyxcbiAgJ2lzRmluaXRlJyxcbiAgJ3BhcnNlSW50JyxcbiAgJ3BhcnNlRmxvYXQnLFxuICAnZGVjb2RlVVJJJyxcbiAgJ2RlY29kZVVSSUNvbXBvbmVudCcsXG4gICdlbmNvZGVVUkknLFxuICAnZW5jb2RlVVJJQ29tcG9uZW50JyxcbiAgLy8gICBXSEFUV0dcbiAgJ3Bvc3RNZXNzYWdlJyxcbiAgJ3N0cnVjdHVyZWRDbG9uZScsXG4gIC8vIC8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gbmV3LWxlc3MgQ29uc3RydWN0b3JzIChzdGlsbCBmdW5jdGlvbnMpXG4gIC8vIC8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gICBUQzM5XG4gICdBcnJheScsIC8vIGRpZmZlcmVudCBiZWhhdmlvciBmcm9tIChhcnJheSlcbiAgJ0JpZ0ludCcsXG4gICdCb29sZWFuJyxcbiAgJ0RhdGUnLFxuICAnTnVtYmVyJyxcbiAgJ09iamVjdCcsIC8vIGRpZmZlcmVudCBiZWhhdmlvciBmcm9tIChoYXNoKVxuICAnU3RyaW5nJyxcbiAgLy8gLy8vLy8vLy8vLy8vLy8vL1xuICAvLyBWYWx1ZXNcbiAgLy8gLy8vLy8vLy8vLy8vLy8vL1xuICAvLyAgIFRDMzlcbiAgJ0luZmluaXR5JyxcbiAgJ05hTicsXG4gIC8vICAgV0hBVFdHXG4gICdpc1NlY3VyZUNvbnRleHQnLFxuXSk7XG5cbi8qXG4gICAgYG1vZGVgIHJlZmVycyB0byB0aGUgaW1wbGljaXQgYW5kIGV4cGxpY2l0IGZvcm1hdHMgZGVmaW5lZCBoZXJlOlxuXG4gICAgICBodHRwczovL2dpdGh1Yi5jb20vZW1iZXJqcy9yZmNzL2Jsb2IvOWZkNmNlYWMyNTU5YmVlMWMzM2FjZjBkNzgzNGU2NzUxMjVhNGYxNi90ZXh0LzA5MzEtdGVtcGxhdGUtY29tcGlsZXItYXBpLm1kI2V4cGxpY2l0LWZvcm1cbiAgICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9lbWJlcmpzL3JmY3MvYmxvYi85ZmQ2Y2VhYzI1NTliZWUxYzMzYWNmMGQ3ODM0ZTY3NTEyNWE0ZjE2L3RleHQvMDkzMS10ZW1wbGF0ZS1jb21waWxlci1hcGkubWQjaW1wbGljaXQtZm9ybVxuXG4gICAgVGhpcyBjbGFzcyBuZWVkcyB0byBrbm93IHRoZSBkaWZmZXJlbmNlIGJlY2F1c2UgaW4gaW1wbGljaXQgZm9ybWF0LCB1cHZhcnNcbiAgICBpbiBoYnMgYXJlIGF1dG9tYWdpY2FsbHkgY29ubmVjdGVkIHdpdGggb3V0ZXIgSmF2YXNjcmlwdCBiaW5kaW5ncywgYW5kIGluXG4gICAgZXhwbGljaXQgZm9ybSB0aGV5IGFyZSBub3QuXG4qL1xudHlwZSBQYXJhbXMgPVxuICB8IHtcbiAgICAgIG1vZGU6ICdleHBsaWNpdCc7XG4gICAgfVxuICB8IHtcbiAgICAgIG1vZGU6ICdpbXBsaWNpdCc7XG4gICAgICBqc1BhdGg6IE5vZGVQYXRoO1xuICAgICAgbWF5VXNlTGV4aWNhbFRoaXM6IGJvb2xlYW47XG4gICAgfTtcblxuZXhwb3J0IGNsYXNzIFNjb3BlTG9jYWxzIHtcbiAgY29uc3RydWN0b3IocGFyYW1zOiBQYXJhbXMpIHtcbiAgICB0aGlzLiNwYXJhbXMgPSBwYXJhbXM7XG4gIH1cblxuICAjbWFwcGluZzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAjbG9jYWxzOiBzdHJpbmdbXSA9IFtdO1xuICAjcGFyYW1zOiBQYXJhbXM7XG5cbiAgZ2V0IGxvY2FscygpIHtcbiAgICByZXR1cm4gcmVhZE9ubHlBcnJheShcbiAgICAgIHRoaXMuI2xvY2FscyxcbiAgICAgICdUaGUgb25seSBzdXBwb3J0ZWQgd2F5IHRvIG1hbmlwdWxhdGUgbG9jYWxzIGlzIHZpYSB0aGUganN1dGlscyBBUElcXG5odHRwczovL2dpdGh1Yi5jb20vZW1iZXJqcy9iYWJlbC1wbHVnaW4tZW1iZXItdGVtcGxhdGUtY29tcGlsYXRpb24janN1dGlscy1tYW5pcHVsYXRpbmctamF2YXNjcmlwdC1mcm9tLXdpdGhpbi1hc3QtdHJhbnNmb3JtcydcbiAgICApO1xuICB9XG5cbiAgaGFzKGtleTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGtleSBpbiB0aGlzLiNtYXBwaW5nO1xuICB9XG5cbiAgZ2V0KGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jbWFwcGluZ1trZXldO1xuICB9XG5cbiAgaXNFbXB0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jbG9jYWxzLmxlbmd0aCA9PT0gMDtcbiAgfVxuXG4gIGVudHJpZXMoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKHRoaXMuI21hcHBpbmcpO1xuICB9XG5cbiAgYWRkKGhic05hbWU6IHN0cmluZywganNOYW1lPzogc3RyaW5nKSB7XG4gICAgdGhpcy4jbWFwcGluZ1toYnNOYW1lXSA9IGpzTmFtZSA/PyBoYnNOYW1lO1xuICAgIGlmICghdGhpcy4jbG9jYWxzLmluY2x1ZGVzKGhic05hbWUpKSB7XG4gICAgICB0aGlzLiNsb2NhbHMucHVzaChoYnNOYW1lKTtcbiAgICB9XG4gIH1cblxuICAjaXNJbkpzU2NvcGUoaGJzTmFtZTogc3RyaW5nLCBqc1BhdGg6IE5vZGVQYXRoKSB7XG4gICAgbGV0IGpzTmFtZSA9IHRoaXMuI21hcHBpbmdbaGJzTmFtZV0gPz8gaGJzTmFtZTtcbiAgICByZXR1cm4gQUxMT1dFRF9HTE9CQUxTLmhhcyhqc05hbWUpIHx8IGpzUGF0aC5zY29wZS5nZXRCaW5kaW5nKGpzTmFtZSk7XG4gIH1cblxuICAvLyB0aGlzIEFTVCB0cmFuc2Zvcm0gZGlzY292ZXJzIGFsbCBwb3NzaWJsZSB1cHZhcnMgaW4gSEJTIHRoYXQgcmVmZXIgdG8gdmFsaWRcbiAgLy8gYmluZGluZ3MgaW4gSlMsIGFuZCB0aGVuIGRlcGVuZGluZyBvbiB0aGUgbW9kZSBhZGp1c3RzIG91ciBhY3R1YWwgc2NvcGUgYmFnXG4gIC8vIGNvbnRlbnRzLlxuICBjcmF3bCgpIHtcbiAgICByZXR1cm4gKF9lbnY6IEFTVFBsdWdpbkVudmlyb25tZW50KTogeyBuYW1lOiBzdHJpbmc7IHZpc2l0b3I6IE5vZGVWaXNpdG9yIH0gPT4ge1xuICAgICAgbGV0IHNlZW46IFNldDxzdHJpbmc+O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogJ3Njb3BlLWxvY2Fscy1jcmF3bCcsXG4gICAgICAgIHZpc2l0b3I6IHtcbiAgICAgICAgICBUZW1wbGF0ZToge1xuICAgICAgICAgICAgZW50ZXI6ICgpID0+IHtcbiAgICAgICAgICAgICAgc2VlbiA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleGl0OiAoX25vZGUsIF9wYXRoKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLiNwYXJhbXMubW9kZSA9PT0gJ2ltcGxpY2l0Jykge1xuICAgICAgICAgICAgICAgIC8vIGFsbCBoYnMgdXB2YXJzIHRoYXQgaGF2ZSBtYXRjaGluZyBKUyBiaW5kaW5ncyBnbyBpbnRvIHRoZVxuICAgICAgICAgICAgICAgIC8vIHNjb3BlXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbmFtZSBvZiBzZWVuKSB7XG4gICAgICAgICAgICAgICAgICBpZiAobmFtZSA9PT0gJ3RoaXMnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLiNwYXJhbXMubWF5VXNlTGV4aWNhbFRoaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZChuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLiNpc0luSnNTY29wZShuYW1lLCB0aGlzLiNwYXJhbXMuanNQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZChuYW1lKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gaW4gZXhwbGljaXQgZm9ybSwgd2UgbWlnaHQgcHJ1bmUgYmFjayB0aGUgcHJlZXhpc2luZyBzY29wZSBpblxuICAgICAgICAgICAgICAgIC8vIHRoZSBjYXNlIHdoZXJlIGFub3RoZXIgQVNUIHRyYW5zZm9ybSBoYXMgZWxpbWluYXRlZCB0aGUgdXNlXG4gICAgICAgICAgICAgICAgLy8gb2YgdGhlIG9yaWdpbmFsIGJpbmRpbmcuIEJ1dCB3ZSBkb24ndCBhZGQgYW55dGhpbmcgbmV3LiBUaGVcbiAgICAgICAgICAgICAgICAvLyBvbmx5IHdheSBmb3IgbmV3IGJpbmRpbmdzIHRvIGJlIGludHJvZHVjZWQgaW50byBzY29wZSBpcyBmb3JcbiAgICAgICAgICAgICAgICAvLyBhbm90aGVyIEFTVCB0cmFuc2Zvcm0gdG8gZXhwbGljaXRseSBjYWxsIHRoZSBqc3V0aWxzLCB3aGljaFxuICAgICAgICAgICAgICAgIC8vIGNhbGxzIG91ciBgYWRkYC5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBuYW1lIG9mIE9iamVjdC5rZXlzKHRoaXMuI21hcHBpbmcpKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIXNlZW4uaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuI2xvY2Fscy5zcGxpY2UodGhpcy4jbG9jYWxzLmluZGV4T2YobmFtZSksIDEpO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy4jbWFwcGluZ1tuYW1lXTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBQYXRoRXhwcmVzc2lvbjogKG5vZGUsIHBhdGgpID0+IHtcbiAgICAgICAgICAgIHN3aXRjaCAobm9kZS5oZWFkLnR5cGUpIHtcbiAgICAgICAgICAgICAgY2FzZSAnVGhpc0hlYWQnOlxuICAgICAgICAgICAgICAgIGlmICghYXN0Tm9kZUhhc0JpbmRpbmcocGF0aCwgJ3RoaXMnKSkge1xuICAgICAgICAgICAgICAgICAgc2Vlbi5hZGQoJ3RoaXMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgJ1ZhckhlYWQnOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IG5vZGUuaGVhZC5uYW1lO1xuICAgICAgICAgICAgICAgIGlmICghYXN0Tm9kZUhhc0JpbmRpbmcocGF0aCwgbmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgIHNlZW4uYWRkKG5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgRWxlbWVudE5vZGU6IChub2RlLCBwYXRoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gbm9kZS50YWcuc3BsaXQoJy4nKVswXTtcbiAgICAgICAgICAgIGlmICghYXN0Tm9kZUhhc0JpbmRpbmcocGF0aCwgbmFtZSkpIHtcbiAgICAgICAgICAgICAgc2Vlbi5hZGQobmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfTtcbiAgfVxufVxuIl19