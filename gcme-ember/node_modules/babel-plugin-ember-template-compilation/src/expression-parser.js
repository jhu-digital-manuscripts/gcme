"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionParser = void 0;
const scope_locals_1 = require("./scope-locals");
class ExpressionParser {
    constructor(babel) {
        this.babel = babel;
    }
    parseExpression(invokedName, path) {
        switch (path.node.type) {
            case 'ObjectExpression':
                return this.parseObjectExpression(invokedName, path);
            case 'ArrayExpression': {
                return this.parseArrayExpression(invokedName, path);
            }
            case 'StringLiteral':
            case 'BooleanLiteral':
            case 'NumericLiteral':
                return path.node.value;
            default:
                throw path.buildCodeFrameError(`${invokedName} can only accept static options but you passed ${JSON.stringify(path.node)}`);
        }
    }
    parseArrayExpression(invokedName, path) {
        return path.get('elements').map((element) => {
            if (element.isSpreadElement()) {
                throw element.buildCodeFrameError(`spread element is not allowed here`);
            }
            else if (element.isExpression()) {
                return this.parseExpression(invokedName, element);
            }
            return null;
        });
    }
    parseScope(invokedName, path) {
        let body = undefined;
        if (path.node.type === 'ObjectMethod') {
            body = path.node.body;
        }
        else {
            let { value } = path.node;
            if (this.t.isObjectExpression(value)) {
                throw path.buildCodeFrameError(`Passing an object as the \`scope\` property to inline templates is no longer supported. Please pass a function that returns an object expression instead.`);
            }
            if (this.t.isFunctionExpression(value) || this.t.isArrowFunctionExpression(value)) {
                body = value.body;
            }
        }
        let objExpression = undefined;
        if ((body === null || body === void 0 ? void 0 : body.type) === 'ObjectExpression') {
            objExpression = body;
        }
        else if ((body === null || body === void 0 ? void 0 : body.type) === 'BlockStatement') {
            // SAFETY: We know that the body is a ReturnStatement because we're checking inside
            let returnStatements = body.body.filter((statement) => statement.type === 'ReturnStatement');
            if (returnStatements.length !== 1) {
                throw new Error('Scope functions must have a single return statement which returns an object expression containing references to in-scope values');
            }
            objExpression = returnStatements[0].argument;
        }
        if ((objExpression === null || objExpression === void 0 ? void 0 : objExpression.type) !== 'ObjectExpression') {
            throw path.buildCodeFrameError(`Scope objects for \`${invokedName}\` must be an object expression containing only references to in-scope values, or a function that returns an object expression containing only references to in-scope values`);
        }
        return objExpression.properties.reduce((res, prop) => {
            if (this.t.isSpreadElement(prop)) {
                throw path.buildCodeFrameError(`Scope objects for \`${invokedName}\` may not contain spread elements`);
            }
            if (this.t.isObjectMethod(prop)) {
                throw path.buildCodeFrameError(`Scope objects for \`${invokedName}\` may not contain methods`);
            }
            let { key, value } = prop;
            if (!this.t.isStringLiteral(key) && !this.t.isIdentifier(key)) {
                throw path.buildCodeFrameError(`Scope objects for \`${invokedName}\` may only contain static property names`);
            }
            let propName = name(key);
            switch (value.type) {
                case 'Identifier':
                    res.add(propName, value.name);
                    break;
                case 'ThisExpression':
                    res.add(propName, 'this');
                    break;
                default:
                    throw path.buildCodeFrameError(`Scope objects for \`${invokedName}\` may only contain direct references to in-scope values, e.g. { ${propName} } or { ${propName}: ${propName} }. Found ${value.type}`);
            }
            return res;
        }, new scope_locals_1.ScopeLocals({ mode: 'explicit' }));
    }
    parseEval(invokedName, path) {
        let body;
        if (path.isObjectMethod()) {
            body = path.get('body');
        }
        else if (path.isObjectProperty()) {
            let value = path.get('value');
            if (value.isFunctionExpression()) {
                body = value.get('body');
            }
            else {
                throw path.buildCodeFrameError(`unsupported syntax for \`eval\` parameter to \`${invokedName}\`. It must be an object method or a function.`);
            }
        }
        else {
            throw path.buildCodeFrameError(`unsupported syntax for \`eval\` parameter to \`${invokedName}\`. It must be an object method or a function.`);
        }
        let returnStatements = body
            .get('body')
            .filter((statement) => statement.isReturnStatement());
        if (returnStatements.length !== 1) {
            throw body.buildCodeFrameError('eval function must have a single return statement');
        }
        let returnExpression = returnStatements[0].get('argument');
        if (!returnExpression.isCallExpression()) {
            throw returnStatements[0].buildCodeFrameError('eval function must return `eval(arguments[0])`. Found non-CallExpression.');
        }
        let callee = returnExpression.get('callee');
        if (!callee.isIdentifier() || callee.node.name !== 'eval') {
            throw returnExpression.buildCodeFrameError('eval function must return `eval(arguments[0])`. Found callee is not eval.');
        }
        let args = returnExpression.get('arguments');
        if (args.length !== 1) {
            throw returnExpression.buildCodeFrameError('eval function must return `eval(arguments[0])`. Found incorrect number of arguments.');
        }
        let arg = args[0];
        if (!arg.isMemberExpression()) {
            throw arg.buildCodeFrameError('eval function must return `eval(arguments[0])`. Found argument is non-MemberExpression.');
        }
        let obj = arg.get('object');
        if (!obj.isIdentifier() || obj.node.name !== 'arguments') {
            throw obj.buildCodeFrameError('eval function must return `eval(arguments[0])`. Found wrong argument to eval.');
        }
        let prop = arg.get('property');
        if (!prop.isNumericLiteral() || prop.node.value !== 0) {
            throw prop.buildCodeFrameError('eval function must return `eval(arguments[0])`. Found wrong property.');
        }
        return { isEval: true };
    }
    parseObjectExpression(invokedName, path, shouldParseScope = false, shouldSupportRFC931 = false) {
        let result = {};
        path.get('properties').forEach((property) => {
            let { node } = property;
            if (this.t.isSpreadElement(node)) {
                throw property.buildCodeFrameError(`${invokedName} does not allow spread element`);
            }
            if (node.computed) {
                throw property.buildCodeFrameError(`${invokedName} can only accept static property names`);
            }
            let { key } = node;
            if (!this.t.isIdentifier(key) && !this.t.isStringLiteral(key)) {
                throw property.buildCodeFrameError(`${invokedName} can only accept static property names`);
            }
            let propertyName = name(key);
            if (shouldParseScope && propertyName === 'scope') {
                result.scope = this.parseScope(invokedName, property);
            }
            else if (shouldSupportRFC931 && propertyName === 'eval') {
                result.eval = this.parseEval(invokedName, property);
            }
            else if (shouldSupportRFC931 && propertyName === 'component') {
                result.component = property.get('value');
            }
            else {
                if (this.t.isObjectMethod(node)) {
                    throw property.buildCodeFrameError(`${invokedName} does not accept a method for ${propertyName}`);
                }
                let valuePath = property.get('value');
                if (!valuePath.isExpression()) {
                    throw valuePath.buildCodeFrameError(`must be an expression`);
                }
                result[propertyName] = this.parseExpression(invokedName, valuePath);
            }
        });
        return result;
    }
    get t() {
        return this.babel.types;
    }
}
exports.ExpressionParser = ExpressionParser;
function name(node) {
    if (node.type === 'StringLiteral') {
        return node.value;
    }
    else {
        return node.name;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzc2lvbi1wYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJleHByZXNzaW9uLXBhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxpREFBNkM7QUFFN0MsTUFBYSxnQkFBZ0I7SUFDM0IsWUFBb0IsS0FBbUI7UUFBbkIsVUFBSyxHQUFMLEtBQUssQ0FBYztJQUFHLENBQUM7SUFFM0MsZUFBZSxDQUFDLFdBQW1CLEVBQUUsSUFBNEI7UUFDL0QsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3ZCLEtBQUssa0JBQWtCO2dCQUNyQixPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLEVBQUUsSUFBb0MsQ0FBQyxDQUFDO1lBQ3ZGLEtBQUssaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUN2QixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLEVBQUUsSUFBbUMsQ0FBQyxDQUFDO1lBQ3JGLENBQUM7WUFDRCxLQUFLLGVBQWUsQ0FBQztZQUNyQixLQUFLLGdCQUFnQixDQUFDO1lBQ3RCLEtBQUssZ0JBQWdCO2dCQUNuQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3pCO2dCQUNFLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUM1QixHQUFHLFdBQVcsa0RBQWtELElBQUksQ0FBQyxTQUFTLENBQzVFLElBQUksQ0FBQyxJQUFJLENBQ1YsRUFBRSxDQUNKLENBQUM7UUFDTixDQUFDO0lBQ0gsQ0FBQztJQUVELG9CQUFvQixDQUFDLFdBQW1CLEVBQUUsSUFBaUM7UUFDekUsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQzFDLElBQUksT0FBTyxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sT0FBTyxDQUFDLG1CQUFtQixDQUFDLG9DQUFvQyxDQUFDLENB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dmVyc2UnO1xuaW1wb3J0IHR5cGUgKiBhcyBCYWJlbCBmcm9tICdAYmFiZWwvY29yZSc7XG5pbXBvcnQgdHlwZSB7IHR5cGVzIGFzIHQgfSBmcm9tICdAYmFiZWwvY29yZSc7XG5pbXBvcnQgeyBTY29wZUxvY2FscyB9IGZyb20gJy4vc2NvcGUtbG9jYWxzJztcblxuZXhwb3J0IGNsYXNzIEV4cHJlc3Npb25QYXJzZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGJhYmVsOiB0eXBlb2YgQmFiZWwpIHt9XG5cbiAgcGFyc2VFeHByZXNzaW9uKGludm9rZWROYW1lOiBzdHJpbmcsIHBhdGg6IE5vZGVQYXRoPHQuRXhwcmVzc2lvbj4pOiB1bmtub3duIHtcbiAgICBzd2l0Y2ggKHBhdGgubm9kZS50eXBlKSB7XG4gICAgICBjYXNlICdPYmplY3RFeHByZXNzaW9uJzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPYmplY3RFeHByZXNzaW9uKGludm9rZWROYW1lLCBwYXRoIGFzIE5vZGVQYXRoPHQuT2JqZWN0RXhwcmVzc2lvbj4pO1xuICAgICAgY2FzZSAnQXJyYXlFeHByZXNzaW9uJzoge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUFycmF5RXhwcmVzc2lvbihpbnZva2VkTmFtZSwgcGF0aCBhcyBOb2RlUGF0aDx0LkFycmF5RXhwcmVzc2lvbj4pO1xuICAgICAgfVxuICAgICAgY2FzZSAnU3RyaW5nTGl0ZXJhbCc6XG4gICAgICBjYXNlICdCb29sZWFuTGl0ZXJhbCc6XG4gICAgICBjYXNlICdOdW1lcmljTGl0ZXJhbCc6XG4gICAgICAgIHJldHVybiBwYXRoLm5vZGUudmFsdWU7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBwYXRoLmJ1aWxkQ29kZUZyYW1lRXJyb3IoXG4gICAgICAgICAgYCR7aW52b2tlZE5hbWV9IGNhbiBvbmx5IGFjY2VwdCBzdGF0aWMgb3B0aW9ucyBidXQgeW91IHBhc3NlZCAke0pTT04uc3RyaW5naWZ5KFxuICAgICAgICAgICAgcGF0aC5ub2RlXG4gICAgICAgICAgKX1gXG4gICAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VBcnJheUV4cHJlc3Npb24oaW52b2tlZE5hbWU6IHN0cmluZywgcGF0aDogTm9kZVBhdGg8dC5BcnJheUV4cHJlc3Npb24+KSB7XG4gICAgcmV0dXJuIHBhdGguZ2V0KCdlbGVtZW50cycpLm1hcCgoZWxlbWVudCkgPT4ge1xuICAgICAgaWYgKGVsZW1lbnQuaXNTcHJlYWRFbGVtZW50KCkpIHtcbiAgICAgICAgdGhyb3cgZWxlbWVudC5idWlsZENvZGVGcmFtZUVycm9yKGBzcHJlYWQgZWxlbWVudCBpcyBub3QgYWxsb3dlZCBoZXJlYCk7XG4gICAgICB9IGVsc2UgaWYgKGVsZW1lbnQuaXNFeHByZXNzaW9uKCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFeHByZXNzaW9uKGludm9rZWROYW1lLCBlbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgcGFyc2VTY29wZShpbnZva2VkTmFtZTogc3RyaW5nLCBwYXRoOiBOb2RlUGF0aDx0Lk9iamVjdFByb3BlcnR5IHwgdC5PYmplY3RNZXRob2Q+KTogU2NvcGVMb2NhbHMge1xuICAgIGxldCBib2R5OiB0LkJsb2NrU3RhdGVtZW50IHwgdC5FeHByZXNzaW9uIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKHBhdGgubm9kZS50eXBlID09PSAnT2JqZWN0TWV0aG9kJykge1xuICAgICAgYm9keSA9IHBhdGgubm9kZS5ib2R5O1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgeyB2YWx1ZSB9ID0gcGF0aC5ub2RlO1xuICAgICAgaWYgKHRoaXMudC5pc09iamVjdEV4cHJlc3Npb24odmFsdWUpKSB7XG4gICAgICAgIHRocm93IHBhdGguYnVpbGRDb2RlRnJhbWVFcnJvcihcbiAgICAgICAgICBgUGFzc2luZyBhbiBvYmplY3QgYXMgdGhlIFxcYHNjb3BlXFxgIHByb3BlcnR5IHRvIGlubGluZSB0ZW1wbGF0ZXMgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZC4gUGxlYXNlIHBhc3MgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYW4gb2JqZWN0IGV4cHJlc3Npb24gaW5zdGVhZC5gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy50LmlzRnVuY3Rpb25FeHByZXNzaW9uKHZhbHVlKSB8fCB0aGlzLnQuaXNBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbih2YWx1ZSkpIHtcbiAgICAgICAgYm9keSA9IHZhbHVlLmJvZHk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IG9iakV4cHJlc3Npb246IHQuRXhwcmVzc2lvbiB8IHVuZGVmaW5lZCB8IG51bGwgPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAoYm9keT8udHlwZSA9PT0gJ09iamVjdEV4cHJlc3Npb24nKSB7XG4gICAgICBvYmpFeHByZXNzaW9uID0gYm9keTtcbiAgICB9IGVsc2UgaWYgKGJvZHk/LnR5cGUgPT09ICdCbG9ja1N0YXRlbWVudCcpIHtcbiAgICAgIC8vIFNBRkVUWTogV2Uga25vdyB0aGF0IHRoZSBib2R5IGlzIGEgUmV0dXJuU3RhdGVtZW50IGJlY2F1c2Ugd2UncmUgY2hlY2tpbmcgaW5zaWRlXG4gICAgICBsZXQgcmV0dXJuU3RhdGVtZW50cyA9IGJvZHkuYm9keS5maWx0ZXIoXG4gICAgICAgIChzdGF0ZW1lbnQpID0+IHN0YXRlbWVudC50eXBlID09PSAnUmV0dXJuU3RhdGVtZW50J1xuICAgICAgKSBhcyBCYWJlbC50eXBlcy5SZXR1cm5TdGF0ZW1lbnRbXTtcblxuICAgICAgaWYgKHJldHVyblN0YXRlbWVudHMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnU2NvcGUgZnVuY3Rpb25zIG11c3QgaGF2ZSBhIHNpbmdsZSByZXR1cm4gc3RhdGVtZW50IHdoaWNoIHJldHVybnMgYW4gb2JqZWN0IGV4cHJlc3Npb24gY29udGFpbmluZyByZWZlcmVuY2VzIHRvIGluLXNjb3BlIHZhbHVlcydcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgb2JqRXhwcmVzc2lvbiA9IHJldHVyblN0YXRlbWVudHNbMF0uYXJndW1lbnQ7XG4gICAgfVxuXG4gICAgaWYgKG9iakV4cHJlc3Npb24/LnR5cGUgIT09ICdPYmplY3RFeHByZXNzaW9uJykge1xuICAgICAgdGhyb3cgcGF0aC5idWlsZENvZGVGcmFtZUVycm9yKFxuICAgICAgICBgU2NvcGUgb2JqZWN0cyBmb3IgXFxgJHtpbnZva2VkTmFtZX1cXGAgbXVzdCBiZSBhbiBvYmplY3QgZXhwcmVzc2lvbiBjb250YWluaW5nIG9ubHkgcmVmZXJlbmNlcyB0byBpbi1zY29wZSB2YWx1ZXMsIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFuIG9iamVjdCBleHByZXNzaW9uIGNvbnRhaW5pbmcgb25seSByZWZlcmVuY2VzIHRvIGluLXNjb3BlIHZhbHVlc2BcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iakV4cHJlc3Npb24ucHJvcGVydGllcy5yZWR1Y2UoXG4gICAgICAocmVzLCBwcm9wKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnQuaXNTcHJlYWRFbGVtZW50KHByb3ApKSB7XG4gICAgICAgICAgdGhyb3cgcGF0aC5idWlsZENvZGVGcmFtZUVycm9yKFxuICAgICAgICAgICAgYFNjb3BlIG9iamVjdHMgZm9yIFxcYCR7aW52b2tlZE5hbWV9XFxgIG1heSBub3QgY29udGFpbiBzcHJlYWQgZWxlbWVudHNgXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy50LmlzT2JqZWN0TWV0aG9kKHByb3ApKSB7XG4gICAgICAgICAgdGhyb3cgcGF0aC5idWlsZENvZGVGcmFtZUVycm9yKFxuICAgICAgICAgICAgYFNjb3BlIG9iamVjdHMgZm9yIFxcYCR7aW52b2tlZE5hbWV9XFxgIG1heSBub3QgY29udGFpbiBtZXRob2RzYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgeyBrZXksIHZhbHVlIH0gPSBwcm9wO1xuICAgICAgICBpZiAoIXRoaXMudC5pc1N0cmluZ0xpdGVyYWwoa2V5KSAmJiAhdGhpcy50LmlzSWRlbnRpZmllcihrZXkpKSB7XG4gICAgICAgICAgdGhyb3cgcGF0aC5idWlsZENvZGVGcmFtZUVycm9yKFxuICAgICAgICAgICAgYFNjb3BlIG9iamVjdHMgZm9yIFxcYCR7aW52b2tlZE5hbWV9XFxgIG1heSBvbmx5IGNvbnRhaW4gc3RhdGljIHByb3BlcnR5IG5hbWVzYFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcHJvcE5hbWUgPSBuYW1lKGtleSk7XG5cbiAgICAgICAgc3dpdGNoICh2YWx1ZS50eXBlKSB7XG4gICAgICAgICAgY2FzZSAnSWRlbnRpZmllcic6XG4gICAgICAgICAgICByZXMuYWRkKHByb3BOYW1lLCB2YWx1ZS5uYW1lKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ1RoaXNFeHByZXNzaW9uJzpcbiAgICAgICAgICAgIHJlcy5hZGQocHJvcE5hbWUsICd0aGlzJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgcGF0aC5idWlsZENvZGVGcmFtZUVycm9yKFxuICAgICAgICAgICAgICBgU2NvcGUgb2JqZWN0cyBmb3IgXFxgJHtpbnZva2VkTmFtZX1cXGAgbWF5IG9ubHkgY29udGFpbiBkaXJlY3QgcmVmZXJlbmNlcyB0byBpbi1zY29wZSB2YWx1ZXMsIGUuZy4geyAke3Byb3BOYW1lfSB9IG9yIHsgJHtwcm9wTmFtZX06ICR7cHJvcE5hbWV9IH0uIEZvdW5kICR7dmFsdWUudHlwZX1gXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgICB9LFxuICAgICAgbmV3IFNjb3BlTG9jYWxzKHsgbW9kZTogJ2V4cGxpY2l0JyB9KVxuICAgICk7XG4gIH1cblxuICBwYXJzZUV2YWwoXG4gICAgaW52b2tlZE5hbWU6IHN0cmluZyxcbiAgICBwYXRoOiBOb2RlUGF0aDx0Lk9iamVjdFByb3BlcnR5IHwgdC5PYmplY3RNZXRob2Q+XG4gICk6IHsgaXNFdmFsOiB0cnVlIH0ge1xuICAgIGxldCBib2R5OiBOb2RlUGF0aDx0LkJsb2NrU3RhdGVtZW50PjtcblxuICAgIGlmIChwYXRoLmlzT2JqZWN0TWV0aG9kKCkpIHtcbiAgICAgIGJvZHkgPSBwYXRoLmdldCgnYm9keScpO1xuICAgIH0gZWxzZSBpZiAocGF0aC5pc09iamVjdFByb3BlcnR5KCkpIHtcbiAgICAgIGxldCB2YWx1ZSA9IHBhdGguZ2V0KCd2YWx1ZScpO1xuICAgICAgaWYgKHZhbHVlLmlzRnVuY3Rpb25FeHByZXNzaW9uKCkpIHtcbiAgICAgICAgYm9keSA9IHZhbHVlLmdldCgnYm9keScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgcGF0aC5idWlsZENvZGVGcmFtZUVycm9yKFxuICAgICAgICAgIGB1bnN1cHBvcnRlZCBzeW50YXggZm9yIFxcYGV2YWxcXGAgcGFyYW1ldGVyIHRvIFxcYCR7aW52b2tlZE5hbWV9XFxgLiBJdCBtdXN0IGJlIGFuIG9iamVjdCBtZXRob2Qgb3IgYSBmdW5jdGlvbi5gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHBhdGguYnVpbGRDb2RlRnJhbWVFcnJvcihcbiAgICAgICAgYHVuc3VwcG9ydGVkIHN5bnRheCBmb3IgXFxgZXZhbFxcYCBwYXJhbWV0ZXIgdG8gXFxgJHtpbnZva2VkTmFtZX1cXGAuIEl0IG11c3QgYmUgYW4gb2JqZWN0IG1ldGhvZCBvciBhIGZ1bmN0aW9uLmBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbGV0IHJldHVyblN0YXRlbWVudHMgPSBib2R5XG4gICAgICAuZ2V0KCdib2R5JylcbiAgICAgIC5maWx0ZXIoKHN0YXRlbWVudCkgPT4gc3RhdGVtZW50LmlzUmV0dXJuU3RhdGVtZW50KCkpIGFzIE5vZGVQYXRoPHQuUmV0dXJuU3RhdGVtZW50PltdO1xuXG4gICAgaWYgKHJldHVyblN0YXRlbWVudHMubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBib2R5LmJ1aWxkQ29kZUZyYW1lRXJyb3IoJ2V2YWwgZnVuY3Rpb24gbXVzdCBoYXZlIGEgc2luZ2xlIHJldHVybiBzdGF0ZW1lbnQnKTtcbiAgICB9XG5cbiAgICBsZXQgcmV0dXJuRXhwcmVzc2lvbiA9IHJldHVyblN0YXRlbWVudHNbMF0uZ2V0KCdhcmd1bWVudCcpO1xuXG4gICAgaWYgKCFyZXR1cm5FeHByZXNzaW9uLmlzQ2FsbEV4cHJlc3Npb24oKSkge1xuICAgICAgdGhyb3cgcmV0dXJuU3RhdGVtZW50c1swXS5idWlsZENvZGVGcmFtZUVycm9yKFxuICAgICAgICAnZXZhbCBmdW5jdGlvbiBtdXN0IHJldHVybiBgZXZhbChhcmd1bWVudHNbMF0pYC4gRm91bmQgbm9uLUNhbGxFeHByZXNzaW9uLidcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbGV0IGNhbGxlZSA9IHJldHVybkV4cHJlc3Npb24uZ2V0KCdjYWxsZWUnKTtcbiAgICBpZiAoIWNhbGxlZS5pc0lkZW50aWZpZXIoKSB8fCBjYWxsZWUubm9kZS5uYW1lICE9PSAnZXZhbCcpIHtcbiAgICAgIHRocm93IHJldHVybkV4cHJlc3Npb24uYnVpbGRDb2RlRnJhbWVFcnJvcihcbiAgICAgICAgJ2V2YWwgZnVuY3Rpb24gbXVzdCByZXR1cm4gYGV2YWwoYXJndW1lbnRzWzBdKWAuIEZvdW5kIGNhbGxlZSBpcyBub3QgZXZhbC4nXG4gICAgICApO1xuICAgIH1cblxuICAgIGxldCBhcmdzID0gcmV0dXJuRXhwcmVzc2lvbi5nZXQoJ2FyZ3VtZW50cycpO1xuICAgIGlmIChhcmdzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgcmV0dXJuRXhwcmVzc2lvbi5idWlsZENvZGVGcmFtZUVycm9yKFxuICAgICAgICAnZXZhbCBmdW5jdGlvbiBtdXN0IHJldHVybiBgZXZhbChhcmd1bWVudHNbMF0pYC4gRm91bmQgaW5jb3JyZWN0IG51bWJlciBvZiBhcmd1bWVudHMuJ1xuICAgICAgKTtcbiAgICB9XG4gICAgbGV0IGFyZyA9IGFyZ3NbMF07XG4gICAgaWYgKCFhcmcuaXNNZW1iZXJFeHByZXNzaW9uKCkpIHtcbiAgICAgIHRocm93IGFyZy5idWlsZENvZGVGcmFtZUVycm9yKFxuICAgICAgICAnZXZhbCBmdW5jdGlvbiBtdXN0IHJldHVybiBgZXZhbChhcmd1bWVudHNbMF0pYC4gRm91bmQgYXJndW1lbnQgaXMgbm9uLU1lbWJlckV4cHJlc3Npb24uJ1xuICAgICAgKTtcbiAgICB9XG4gICAgbGV0IG9iaiA9IGFyZy5nZXQoJ29iamVjdCcpO1xuICAgIGlmICghb2JqLmlzSWRlbnRpZmllcigpIHx8IG9iai5ub2RlLm5hbWUgIT09ICdhcmd1bWVudHMnKSB7XG4gICAgICB0aHJvdyBvYmouYnVpbGRDb2RlRnJhbWVFcnJvcihcbiAgICAgICAgJ2V2YWwgZnVuY3Rpb24gbXVzdCByZXR1cm4gYGV2YWwoYXJndW1lbnRzWzBdKWAuIEZvdW5kIHdyb25nIGFyZ3VtZW50IHRvIGV2YWwuJ1xuICAgICAgKTtcbiAgICB9XG4gICAgbGV0IHByb3AgPSBhcmcuZ2V0KCdwcm9wZXJ0eScpO1xuICAgIGlmICghcHJvcC5pc051bWVyaWNMaXRlcmFsKCkgfHwgcHJvcC5ub2RlLnZhbHVlICE9PSAwKSB7XG4gICAgICB0aHJvdyBwcm9wLmJ1aWxkQ29kZUZyYW1lRXJyb3IoXG4gICAgICAgICdldmFsIGZ1bmN0aW9uIG11c3QgcmV0dXJuIGBldmFsKGFyZ3VtZW50c1swXSlgLiBGb3VuZCB3cm9uZyBwcm9wZXJ0eS4nXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4geyBpc0V2YWw6IHRydWUgfTtcbiAgfVxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbihcbiAgICBpbnZva2VkTmFtZTogc3RyaW5nLFxuICAgIHBhdGg6IE5vZGVQYXRoPHQuT2JqZWN0RXhwcmVzc2lvbj4sXG4gICAgc2hvdWxkUGFyc2VTY29wZSA9IGZhbHNlLFxuICAgIHNob3VsZFN1cHBvcnRSRkM5MzEgPSBmYWxzZVxuICApIHtcbiAgICBsZXQgcmVzdWx0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuXG4gICAgcGF0aC5nZXQoJ3Byb3BlcnRpZXMnKS5mb3JFYWNoKChwcm9wZXJ0eSkgPT4ge1xuICAgICAgbGV0IHsgbm9kZSB9ID0gcHJvcGVydHk7XG4gICAgICBpZiAodGhpcy50LmlzU3ByZWFkRWxlbWVudChub2RlKSkge1xuICAgICAgICB0aHJvdyBwcm9wZXJ0eS5idWlsZENvZGVGcmFtZUVycm9yKGAke2ludm9rZWROYW1lfSBkb2VzIG5vdCBhbGxvdyBzcHJlYWQgZWxlbWVudGApO1xuICAgICAgfVxuXG4gICAgICBpZiAobm9kZS5jb21wdXRlZCkge1xuICAgICAgICB0aHJvdyBwcm9wZXJ0eS5idWlsZENvZGVGcmFtZUVycm9yKGAke2ludm9rZWROYW1lfSBjYW4gb25seSBhY2NlcHQgc3RhdGljIHByb3BlcnR5IG5hbWVzYCk7XG4gICAgICB9XG5cbiAgICAgIGxldCB7IGtleSB9ID0gbm9kZTtcbiAgICAgIGlmICghdGhpcy50LmlzSWRlbnRpZmllcihrZXkpICYmICF0aGlzLnQuaXNTdHJpbmdMaXRlcmFsKGtleSkpIHtcbiAgICAgICAgdGhyb3cgcHJvcGVydHkuYnVpbGRDb2RlRnJhbWVFcnJvcihgJHtpbnZva2VkTmFtZX0gY2FuIG9ubHkgYWNjZXB0IHN0YXRpYyBwcm9wZXJ0eSBuYW1lc2ApO1xuICAgICAgfVxuXG4gICAgICBsZXQgcHJvcGVydHlOYW1lID0gbmFtZShrZXkpO1xuXG4gICAgICBpZiAoc2hvdWxkUGFyc2VTY29wZSAmJiBwcm9wZXJ0eU5hbWUgPT09ICdzY29wZScpIHtcbiAgICAgICAgcmVzdWx0LnNjb3BlID0gdGhpcy5wYXJzZVNjb3BlKGludm9rZWROYW1lLCBwcm9wZXJ0eSBhcyBOb2RlUGF0aDx0eXBlb2Ygbm9kZT4pO1xuICAgICAgfSBlbHNlIGlmIChzaG91bGRTdXBwb3J0UkZDOTMxICYmIHByb3BlcnR5TmFtZSA9PT0gJ2V2YWwnKSB7XG4gICAgICAgIHJlc3VsdC5ldmFsID0gdGhpcy5wYXJzZUV2YWwoaW52b2tlZE5hbWUsIHByb3BlcnR5IGFzIE5vZGVQYXRoPHR5cGVvZiBub2RlPik7XG4gICAgICB9IGVsc2UgaWYgKHNob3VsZFN1cHBvcnRSRkM5MzEgJiYgcHJvcGVydHlOYW1lID09PSAnY29tcG9uZW50Jykge1xuICAgICAgICByZXN1bHQuY29tcG9uZW50ID0gKHByb3BlcnR5IGFzIE5vZGVQYXRoPHR5cGVvZiBub2RlPikuZ2V0KCd2YWx1ZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMudC5pc09iamVjdE1ldGhvZChub2RlKSkge1xuICAgICAgICAgIHRocm93IHByb3BlcnR5LmJ1aWxkQ29kZUZyYW1lRXJyb3IoXG4gICAgICAgICAgICBgJHtpbnZva2VkTmFtZX0gZG9lcyBub3QgYWNjZXB0IGEgbWV0aG9kIGZvciAke3Byb3BlcnR5TmFtZX1gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdmFsdWVQYXRoID0gKHByb3BlcnR5IGFzIE5vZGVQYXRoPHR5cGVvZiBub2RlPikuZ2V0KCd2YWx1ZScpO1xuICAgICAgICBpZiAoIXZhbHVlUGF0aC5pc0V4cHJlc3Npb24oKSkge1xuICAgICAgICAgIHRocm93IHZhbHVlUGF0aC5idWlsZENvZGVGcmFtZUVycm9yKGBtdXN0IGJlIGFuIGV4cHJlc3Npb25gKTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHRbcHJvcGVydHlOYW1lXSA9IHRoaXMucGFyc2VFeHByZXNzaW9uKGludm9rZWROYW1lLCB2YWx1ZVBhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuYmFiZWwudHlwZXM7XG4gIH1cbn1cblxuZnVuY3Rpb24gbmFtZShub2RlOiB0LlN0cmluZ0xpdGVyYWwgfCB0LklkZW50aWZpZXIpOiBzdHJpbmcge1xuICBpZiAobm9kZS50eXBlID09PSAnU3RyaW5nTGl0ZXJhbCcpIHtcbiAgICByZXR1cm4gbm9kZS52YWx1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbm9kZS5uYW1lO1xuICB9XG59XG4iXX0=