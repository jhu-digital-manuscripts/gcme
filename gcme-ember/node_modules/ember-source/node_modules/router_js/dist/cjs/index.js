"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "default", {
  enumerable: true,
  get: function () {
    return _router.default;
  }
});
Object.defineProperty(exports, "InternalTransition", {
  enumerable: true,
  get: function () {
    return _transition.default;
  }
});
Object.defineProperty(exports, "logAbort", {
  enumerable: true,
  get: function () {
    return _transition.logAbort;
  }
});
Object.defineProperty(exports, "STATE_SYMBOL", {
  enumerable: true,
  get: function () {
    return _transition.STATE_SYMBOL;
  }
});
Object.defineProperty(exports, "PARAMS_SYMBOL", {
  enumerable: true,
  get: function () {
    return _transition.PARAMS_SYMBOL;
  }
});
Object.defineProperty(exports, "QUERY_PARAMS_SYMBOL", {
  enumerable: true,
  get: function () {
    return _transition.QUERY_PARAMS_SYMBOL;
  }
});
Object.defineProperty(exports, "TransitionState", {
  enumerable: true,
  get: function () {
    return _transitionState.default;
  }
});
Object.defineProperty(exports, "TransitionError", {
  enumerable: true,
  get: function () {
    return _transitionState.TransitionError;
  }
});
Object.defineProperty(exports, "InternalRouteInfo", {
  enumerable: true,
  get: function () {
    return _routeInfo.default;
  }
});

var _router = _interopRequireDefault(require("./router"));

var _transition = _interopRequireWildcard(require("./transition"));

var _transitionState = _interopRequireWildcard(require("./transition-state"));

var _routeInfo = _interopRequireDefault(require("./route-info"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }