// check if window exists and actually is the global
const hasDOM = typeof self === 'object' && self !== null && self.Object === Object && typeof Window !== 'undefined' && self.constructor === Window && typeof document === 'object' && document !== null && self.document === document && typeof location === 'object' && location !== null && self.location === location && typeof history === 'object' && history !== null && self.history === history && typeof navigator === 'object' && navigator !== null && self.navigator === navigator && typeof navigator.userAgent === 'string';

const window = hasDOM ? self : null;
const location$1 = hasDOM ? self.location : null;
const history$1 = hasDOM ? self.history : null;
const userAgent = hasDOM ? self.navigator.userAgent : 'Lynx (textmode)';
const isChrome = hasDOM ? typeof chrome === 'object' && !(typeof opera === 'object') : false;
const isFirefox = hasDOM ? /Firefox|FxiOS/.test(userAgent) : false;

const environment = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  hasDOM,
  history: history$1,
  isChrome,
  isFirefox,
  location: location$1,
  userAgent,
  window
}, Symbol.toStringTag, { value: 'Module' }));

export { isChrome as a, history$1 as b, environment as e, hasDOM as h, isFirefox as i, location$1 as l, userAgent as u, window as w };
