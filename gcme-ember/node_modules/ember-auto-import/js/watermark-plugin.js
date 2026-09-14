"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = watermark;
function watermark(babel) {
    return {
        visitor: {
            Identifier(path) {
                if (path.node.name === '__EAI_WATERMARK__') {
                    path.replaceWith(babel.types.stringLiteral('successfully watermarked'));
                }
            },
        },
    };
}
//# sourceMappingURL=watermark-plugin.js.map