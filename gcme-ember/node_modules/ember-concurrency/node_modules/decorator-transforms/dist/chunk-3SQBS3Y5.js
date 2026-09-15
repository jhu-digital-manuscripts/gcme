import {
  __export
} from "./chunk-CSAU5B4Q.js";

// src/runtime.ts
var runtime_exports = {};
__export(runtime_exports, {
  c: () => decorateClass,
  f: () => decorateFieldV1,
  g: () => decorateFieldV2,
  i: () => initializeDeferredDecorator,
  m: () => decorateMethodV1,
  n: () => decorateMethodV2,
  p: () => decoratePOJO
});
var deferred = /* @__PURE__ */ new WeakMap();
function deferDecorator(proto, prop, desc) {
  let map = deferred.get(proto);
  if (!map) {
    map = /* @__PURE__ */ new Map();
    deferred.set(proto, map);
  }
  map.set(prop, desc);
}
function findDeferredDecorator(target, prop) {
  let cursor = target.prototype;
  while (cursor) {
    let desc = deferred.get(cursor)?.get(prop);
    if (desc) {
      return desc;
    }
    cursor = cursor.prototype;
  }
}
function decorateFieldV1(target, prop, decorators, initializer) {
  return decorateFieldV2(target.prototype, prop, decorators, initializer);
}
function decorateFieldV2(prototype, prop, decorators, initializer) {
  let desc = {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  };
  if (initializer) {
    desc.initializer = initializer;
  }
  for (let decorator of decorators) {
    desc = decorator(prototype, prop, desc) || desc;
  }
  if (desc.initializer === void 0) {
    Object.defineProperty(prototype, prop, desc);
  } else {
    deferDecorator(prototype, prop, desc);
  }
}
function decorateMethodV1({ prototype }, prop, decorators) {
  return decorateMethodV2(prototype, prop, decorators);
}
function decorateMethodV2(prototype, prop, decorators) {
  const origDesc = Object.getOwnPropertyDescriptor(prototype, prop);
  let desc = { ...origDesc };
  for (let decorator of decorators) {
    desc = decorator(prototype, prop, desc) || desc;
  }
  if (desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(prototype) : void 0;
    desc.initializer = void 0;
  }
  Object.defineProperty(prototype, prop, desc);
}
function initializeDeferredDecorator(target, prop) {
  let desc = findDeferredDecorator(target.constructor, prop);
  if (desc) {
    Object.defineProperty(target, prop, {
      enumerable: desc.enumerable,
      configurable: desc.configurable,
      writable: desc.writable,
      value: desc.initializer ? desc.initializer.call(target) : void 0
    });
  }
}
function decorateClass(target, decorators) {
  return decorators.reduce(
    (accum, decorator) => decorator(accum) || accum,
    target
  );
}
function decoratePOJO(pojo, decorated) {
  for (let [type, prop, decorators] of decorated) {
    if (type === "field") {
      decoratePojoField(pojo, prop, decorators);
    } else {
      decorateMethodV2(pojo, prop, decorators);
    }
  }
  return pojo;
}
function decoratePojoField(pojo, prop, decorators) {
  let desc = {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: () => Object.getOwnPropertyDescriptor(pojo, prop)?.value
  };
  for (let decorator of decorators) {
    desc = decorator(pojo, prop, desc) || desc;
  }
  if (desc.initializer) {
    desc.value = desc.initializer.call(pojo);
    delete desc.initializer;
  }
  Object.defineProperty(pojo, prop, desc);
}

export {
  decorateFieldV1,
  decorateFieldV2,
  decorateMethodV1,
  decorateMethodV2,
  initializeDeferredDecorator,
  decorateClass,
  decoratePOJO,
  runtime_exports
};
//# sourceMappingURL=chunk-3SQBS3Y5.js.map