"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = evaluate;
function evaluate(node) {
    switch (node.type) {
        case 'StringLiteral':
        case 'NumberLiteral':
        case 'BooleanLiteral':
        case 'NullLiteral':
        case 'UndefinedLiteral':
            return { confident: true, value: node.value };
        default:
            return { confident: false };
    }
}
//# sourceMappingURL=evaluate.js.map