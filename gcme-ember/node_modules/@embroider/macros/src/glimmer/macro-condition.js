"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.macroIfBlock = macroIfBlock;
exports.macroIfExpression = macroIfExpression;
exports.macroIfMustache = macroIfMustache;
exports.macroUnlessBlock = macroUnlessBlock;
exports.macroUnlessExpression = macroUnlessExpression;
exports.macroUnlessMustache = macroUnlessMustache;
const evaluate_1 = __importDefault(require("./evaluate"));
function macroIfBlock(node) {
    let condition = node.params[0];
    if (!condition || condition.type !== 'SubExpression' || condition.path.original !== 'macroCondition') {
        return node;
    }
    if (condition.params.length !== 1) {
        throw new Error(`macroCondition requires one arguments, you passed ${node.params.length}`);
    }
    let result = (0, evaluate_1.default)(condition.params[0]);
    if (!result.confident) {
        throw new Error(`argument to macroCondition must be statically analyzable`);
    }
    if (result.value) {
        return node.program.body;
    }
    else {
        if (node.inverse) {
            return node.inverse.body;
        }
        else {
            return [];
        }
    }
}
function macroIfExpression(node, builders) {
    let condition = node.params[0];
    if (!condition || condition.type !== 'SubExpression' || condition.path.original !== 'macroCondition') {
        return node;
    }
    if (condition.params.length !== 1) {
        throw new Error(`macroCondition requires one arguments, you passed ${node.params.length}`);
    }
    let result = (0, evaluate_1.default)(condition.params[0]);
    if (!result.confident) {
        throw new Error(`argument to macroCondition must be statically analyzable`);
    }
    if (result.value) {
        return node.params[1];
    }
    else {
        return node.params[2] || builders.undefined();
    }
}
function macroIfMustache(node, builders) {
    let result = macroIfExpression(node, builders);
    if (result === node) {
        return node;
    }
    if (result.type === 'SubExpression') {
        return builders.mustache(result.path, result.params, result.hash);
    }
    return builders.mustache(result);
}
function macroUnlessBlock(node) {
    let condition = node.params[0];
    if (!condition || condition.type !== 'SubExpression' || condition.path.original !== 'macroCondition') {
        return node;
    }
    if (condition.params.length !== 1) {
        throw new Error(`macroCondition requires one arguments, you passed ${node.params.length}`);
    }
    let result = (0, evaluate_1.default)(condition.params[0]);
    if (!result.confident) {
        throw new Error(`argument to macroCondition must be statically analyzable`);
    }
    if (result.value) {
        if (node.inverse) {
            return node.inverse.body;
        }
        else {
            return [];
        }
    }
    else {
        return node.program.body;
    }
}
function macroUnlessExpression(node, builders) {
    let condition = node.params[0];
    if (!condition || condition.type !== 'SubExpression' || condition.path.original !== 'macroCondition') {
        return node;
    }
    if (condition.params.length !== 1) {
        throw new Error(`macroCondition requires one arguments, you passed ${node.params.length}`);
    }
    let result = (0, evaluate_1.default)(condition.params[0]);
    if (!result.confident) {
        throw new Error(`argument to macroCondition must be statically analyzable`);
    }
    if (result.value) {
        return node.params[2] || builders.undefined();
    }
    else {
        return node.params[1];
    }
}
function macroUnlessMustache(node, builders) {
    let result = macroUnlessExpression(node, builders);
    if (result === node) {
        return node;
    }
    if (result.type === 'SubExpression') {
        return builders.mustache(result.path, result.params, result.hash);
    }
    return builders.mustache(result);
}
//# sourceMappingURL=macro-condition.js.map