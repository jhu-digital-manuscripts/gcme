"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const plugin_1 = require("./plugin");
const ember_template_compiler_1 = require("./ember-template-compiler");
__exportStar(require("./public-types"), exports);
function cwdRequire(moduleName) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(require.resolve(moduleName, { paths: [process.cwd()] }));
}
function handleNodeSpecificOptions(opts) {
    let compiler = undefined;
    if (opts.compilerPath) {
        let mod = cwdRequire(opts.compilerPath);
        (0, ember_template_compiler_1.assertTemplateCompiler)(mod);
        compiler = mod;
    }
    else if (opts.compiler) {
        (0, ember_template_compiler_1.assertTemplateCompiler)(opts.compiler);
        compiler = opts.compiler;
    }
    else {
        let mod = cwdRequire('ember-source/dist/ember-template-compiler.js');
        (0, ember_template_compiler_1.assertTemplateCompiler)(mod);
        compiler = mod;
    }
    let transforms = [];
    if (opts.transforms) {
        transforms = opts.transforms.map((t) => {
            if (typeof t === 'string') {
                return esCompat(cwdRequire(t)).default;
            }
            else if (Array.isArray(t) && typeof t[0] === 'string') {
                return esCompat(cwdRequire(t[0])).default.call(undefined, t[1]);
            }
            else {
                return t;
            }
        });
    }
    return Object.assign(Object.assign({}, opts), { transforms, compiler });
}
const htmlbarsInlinePrecompile = (0, plugin_1.makePlugin)(handleNodeSpecificOptions);
htmlbarsInlinePrecompile._parallelBabel = {
    requireFile: __filename,
};
htmlbarsInlinePrecompile.baseDir = function () {
    return (0, path_1.resolve)(__dirname, '..');
};
exports.default = htmlbarsInlinePrecompile;
function esCompat(m) {
    return (m === null || m === void 0 ? void 0 : m.__esModule) ? m : { default: m };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS1tYWluLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibm9kZS1tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBK0I7QUFDL0IscUNBQXNDO0FBR3RDLHVFQUEwRjtBQUcxRixpREFBK0I7QUEwQi9CLFNBQVMsVUFBVSxDQUFDLFVBQWtCO0lBQ3BDLDhEQUE4RDtJQUM5RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzFFLENBQUM7QUFFRCxTQUFTLHlCQUF5QixDQUFDLElBQWE7SUFDOUMsSUFBSSxRQUFRLEdBQXNDLFNBQVMsQ0FBQztJQUM1RCxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN0QixJQUFJLEdBQUcsR0FBUSxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzdDLElBQUEsZ0RBQXNCLEVBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsUUFBUSxHQUFHLEdBQUcsQ0FBQztJQUNqQixDQUFDO1NBQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDekIsSUFBQSxnREFBc0IsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDM0IsQ0FBQztTQUFNLENBQUM7UUFDTixJQUFJLEdBQUcsR0FBUSxVQUFVLENBQUMsOENBQThDLENBQUMsQ0FBQztRQUMxRSxJQUFBLGdEQUFzQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVCLFFBQVEsR0FBRyxHQUFHLENBQUM7SUFDakIsQ0FBQztJQUVELElBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQztJQUNwQixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNwQixVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUNyQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMxQixPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFDekMsQ0FBQztpQkFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3hELE9BQU8sUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLENBQUM7aUJBQU0sQ0FBQztnQkFDTixPQUFPLENBQUMsQ0FBQztZQUNYLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCx1Q0FBWSxJQUFJLEtBQUUsVUFBVSxFQUFFLFFBQVEsSUFBRztBQUMzQyxDQUFDO0FBRUQsTUFBTSx3QkFBd0IsR0FBRyxJQUFBLG1CQUFVLEVBQUMseUJBQXlCLENBQUMsQ0FBQztBQUV0RSx3QkFBZ0MsQ0FBQyxjQUFjLEdBQUc7SUFDakQsV0FBVyxFQUFFLFVBQVU7Q0FDeEIsQ0FBQztBQUVELHdCQUFnQyxDQUFDLE9BQU8sR0FBRztJQUMxQyxPQUFPLElBQUEsY0FBTyxFQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNsQyxDQUFDLENBQUM7QUFFRixrQkFBZSx3QkFHZCxDQUFDO0FBRUYsU0FBUyxRQUFRLENBQUMsQ0FBc0I7SUFDdEMsT0FBTyxDQUFBLENBQUMsYUFBRCxDQUFDLHVCQUFELENBQUMsQ0FBRSxVQUFVLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDNUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IG1ha2VQbHVnaW4gfSBmcm9tICcuL3BsdWdpbic7XG5cbmltcG9ydCB7IE9wdGlvbnMgYXMgU2hhcmVkT3B0aW9ucyB9IGZyb20gJy4vcGx1Z2luJztcbmltcG9ydCB7IGFzc2VydFRlbXBsYXRlQ29tcGlsZXIsIEVtYmVyVGVtcGxhdGVDb21waWxlciB9IGZyb20gJy4vZW1iZXItdGVtcGxhdGUtY29tcGlsZXInO1xuaW1wb3J0IHsgRXh0ZW5kZWRQbHVnaW5CdWlsZGVyIH0gZnJvbSAnLi9qcy11dGlscyc7XG5cbmV4cG9ydCAqIGZyb20gJy4vcHVibGljLXR5cGVzJztcblxuZXhwb3J0IHR5cGUgVHJhbnNmb3JtID0gRXh0ZW5kZWRQbHVnaW5CdWlsZGVyIHwgc3RyaW5nIHwgW3N0cmluZywgdW5rbm93bl07XG5cbmV4cG9ydCB0eXBlIE9wdGlvbnMgPSBPbWl0PFNoYXJlZE9wdGlvbnMsICd0cmFuc2Zvcm1zJyB8ICdjb21waWxlcic+ICYge1xuICAvLyBUaGUgb24tZGlzayBwYXRoIHRvIHRoZSBlbWJlci10ZW1wbGF0ZS1jb21waWxlci5qcyBtb2R1bGUgZm9yIG91ciBjdXJyZW50XG4gIC8vIGVtYmVyIHZlcnNpb24uIFlvdSBjYW4gc2V0IGVpdGhlciBgY29tcGlsZXJQYXRoYCBvciBzZXQgYGNvbXBpbGVyYC4gSWYgeW91XG4gIC8vIHNldCBuZWl0aGVyLCB3ZSB3aWxsIGF0dGVtcHQgdG8gcmVzb2x2ZVxuICAvLyBcImVtYmVyLXNvdXJjZS9kaXN0L2VtYmVyLXRlbXBsYXRlLWNvbXBpbGVyLmpzXCIgZnJvbSB0aGUgY3VycmVudCB3b3JraW5nXG4gIC8vIGRpcmVjdG9yeS5cbiAgY29tcGlsZXJQYXRoPzogc3RyaW5nO1xuXG4gIC8vIFRoZSBlbWJlci10ZW1wbGF0ZS1jb21waWxlci5qcyBtb2R1bGUgdGhhdCBzaGlwcyB3aXRoaW4geW91ciBlbWJlci1zb3VyY2VcbiAgLy8gdmVyc2lvbi4gWW91IGNhbiBzZXQgZWl0aGVyIGBjb21waWxlclBhdGhgIG9yIGBjb21waWxlcmAuXG4gIGNvbXBpbGVyPzogRW1iZXJUZW1wbGF0ZUNvbXBpbGVyO1xuXG4gIC8vIExpc3Qgb2YgY3VzdG9tIHRyYW5zZm9ybWF0aW9ucyB0byBhcHBseSB0byB0aGUgaGFuZGxlYmFycyBBU1QgYmVmb3JlXG4gIC8vIGNvbXBpbGF0aW9uLiBUaGVzZSBjYW4gYmVcbiAgLy8gICAtIHRoZSBhY3R1YWwgZnVuY3Rpb25zXG4gIC8vICAgLSByZXNvbHZhYmxlIG1vZHVsZSBuYW1lc1xuICAvLyAgIC0gcGFpcnMgb2YgW3Jlc29sdmFibGVNb2R1bGVOYW1lLCBvcHRpb25zXSwgaW4gd2hpY2ggY2FzZSB3ZSB3aWxsIGludm9rZVxuICAvLyAgICAgdGhlIGRlZmF1bHQgZXhwb3J0IG9mIHRoZSBtb2R1bGUgd2l0aCB0aGUgb3B0aW9ucyBhcyBhcmd1bWVudCwgYW5kIHRoZVxuICAvLyAgICAgYWN0dWFsIGFzdCB0cmFuc2Zvcm0gZnVuY3Rpb24gc2hvdWxkIGJlIHJldHVybmVkLlxuICB0cmFuc2Zvcm1zPzogVHJhbnNmb3JtW107XG59O1xuXG5mdW5jdGlvbiBjd2RSZXF1aXJlKG1vZHVsZU5hbWU6IHN0cmluZykge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXZhci1yZXF1aXJlc1xuICByZXR1cm4gcmVxdWlyZShyZXF1aXJlLnJlc29sdmUobW9kdWxlTmFtZSwgeyBwYXRoczogW3Byb2Nlc3MuY3dkKCldIH0pKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlTm9kZVNwZWNpZmljT3B0aW9ucyhvcHRzOiBPcHRpb25zKTogU2hhcmVkT3B0aW9ucyB7XG4gIGxldCBjb21waWxlcjogRW1iZXJUZW1wbGF0ZUNvbXBpbGVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBpZiAob3B0cy5jb21waWxlclBhdGgpIHtcbiAgICBsZXQgbW9kOiBhbnkgPSBjd2RSZXF1aXJlKG9wdHMuY29tcGlsZXJQYXRoKTtcbiAgICBhc3NlcnRUZW1wbGF0ZUNvbXBpbGVyKG1vZCk7XG4gICAgY29tcGlsZXIgPSBtb2Q7XG4gIH0gZWxzZSBpZiAob3B0cy5jb21waWxlcikge1xuICAgIGFzc2VydFRlbXBsYXRlQ29tcGlsZXIob3B0cy5jb21waWxlcik7XG4gICAgY29tcGlsZXIgPSBvcHRzLmNvbXBpbGVyO1xuICB9IGVsc2Uge1xuICAgIGxldCBtb2Q6IGFueSA9IGN3ZFJlcXVpcmUoJ2VtYmVyLXNvdXJjZS9kaXN0L2VtYmVyLXRlbXBsYXRlLWNvbXBpbGVyLmpzJyk7XG4gICAgYXNzZXJ0VGVtcGxhdGVDb21waWxlcihtb2QpO1xuICAgIGNvbXBpbGVyID0gbW9kO1xuICB9XG5cbiAgbGV0IHRyYW5zZm9ybXMgPSBbXTtcbiAgaWYgKG9wdHMudHJhbnNmb3Jtcykge1xuICAgIHRyYW5zZm9ybXMgPSBvcHRzLnRyYW5zZm9ybXMubWFwKCh0KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBlc0NvbXBhdChjd2RSZXF1aXJlKHQpKS5kZWZhdWx0O1xuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHQpICYmIHR5cGVvZiB0WzBdID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gZXNDb21wYXQoY3dkUmVxdWlyZSh0WzBdKSkuZGVmYXVsdC5jYWxsKHVuZGVmaW5lZCwgdFsxXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICByZXR1cm4geyAuLi5vcHRzLCB0cmFuc2Zvcm1zLCBjb21waWxlciB9O1xufVxuXG5jb25zdCBodG1sYmFyc0lubGluZVByZWNvbXBpbGUgPSBtYWtlUGx1Z2luKGhhbmRsZU5vZGVTcGVjaWZpY09wdGlvbnMpO1xuXG4oaHRtbGJhcnNJbmxpbmVQcmVjb21waWxlIGFzIGFueSkuX3BhcmFsbGVsQmFiZWwgPSB7XG4gIHJlcXVpcmVGaWxlOiBfX2ZpbGVuYW1lLFxufTtcblxuKGh0bWxiYXJzSW5saW5lUHJlY29tcGlsZSBhcyBhbnkpLmJhc2VEaXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiByZXNvbHZlKF9fZGlybmFtZSwgJy4uJyk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBodG1sYmFyc0lubGluZVByZWNvbXBpbGUgYXMgdHlwZW9mIGh0bWxiYXJzSW5saW5lUHJlY29tcGlsZSAmIHtcbiAgYmFzZURpcigpOiBzdHJpbmc7XG4gIF9wYXJhbGxlbEJhYmVsOiB7IHJlcXVpcmVGaWxlOiBzdHJpbmcgfTtcbn07XG5cbmZ1bmN0aW9uIGVzQ29tcGF0KG06IFJlY29yZDxzdHJpbmcsIGFueT4pIHtcbiAgcmV0dXJuIG0/Ll9fZXNNb2R1bGUgPyBtIDogeyBkZWZhdWx0OiBtIH07XG59XG4iXX0=