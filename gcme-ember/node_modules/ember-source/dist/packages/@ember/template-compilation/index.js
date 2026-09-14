import { isDevelopingApp } from '@embroider/macros';

// it is emitted as part of Ember's build!), so we define it as having the type
// which makes that work. However, in practice it is supplied by the build,
// *for* the build, and will *not* be present at runtime, so the actual value
// here is `undefined` in prod; in dev it is a function which throws a somewhat
// nicer error. This is janky, but... here we are.
let __emberTemplateCompiler;
const compileTemplate = (...args) => {
  if (!__emberTemplateCompiler) {
    throw new Error('Attempted to call `compileTemplate` without first loading the runtime template compiler.');
  }
  return __emberTemplateCompiler.compile(...args);
};
let precompileTemplate;
if (isDevelopingApp()) {
  precompileTemplate = () => {
    throw new Error('Attempted to call `precompileTemplate` at runtime, but this API is meant to be used at compile time. You should use `compileTemplate` instead.');
  };
}
function __registerTemplateCompiler(c) {
  __emberTemplateCompiler = c;
}

export { __emberTemplateCompiler, __registerTemplateCompiler, compileTemplate, precompileTemplate };
