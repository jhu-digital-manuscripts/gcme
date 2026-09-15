"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.astNodeHasBinding = astNodeHasBinding;
function astNodeHasBinding(target, name) {
    var _a;
    let cursor = target;
    while (cursor) {
        let parentNode = (_a = cursor.parent) === null || _a === void 0 ? void 0 : _a.node;
        if ((parentNode === null || parentNode === void 0 ? void 0 : parentNode.type) === 'ElementNode' &&
            parentNode.blockParams.includes(name) &&
            // an ElementNode's block params are valid only within its children
            parentNode.children.includes(cursor.node)) {
            return true;
        }
        if ((parentNode === null || parentNode === void 0 ? void 0 : parentNode.type) === 'Block' &&
            parentNode.blockParams.includes(name) &&
            // a Block's blockParams are valid only within its body
            parentNode.body.includes(cursor.node)) {
            return true;
        }
        cursor = cursor.parent;
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGJzLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaGJzLXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsOENBeUJDO0FBekJELFNBQWdCLGlCQUFpQixDQUFDLE1BQThCLEVBQUUsSUFBWTs7SUFDNUUsSUFBSSxNQUFNLEdBQWtDLE1BQU0sQ0FBQztJQUNuRCxPQUFPLE1BQU0sRUFBRSxDQUFDO1FBQ2QsSUFBSSxVQUFVLEdBQUcsTUFBQSxNQUFNLENBQUMsTUFBTSwwQ0FBRSxJQUFJLENBQUM7UUFDckMsSUFDRSxDQUFBLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRSxJQUFJLE1BQUssYUFBYTtZQUNsQyxVQUFVLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFDckMsbUVBQW1FO1lBQ25FLFVBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUF1QixDQUFDLEVBQzVELENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFFRCxJQUNFLENBQUEsVUFBVSxhQUFWLFVBQVUsdUJBQVYsVUFBVSxDQUFFLElBQUksTUFBSyxPQUFPO1lBQzVCLFVBQVUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztZQUNyQyx1REFBdUQ7WUFDdkQsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQXVCLENBQUMsRUFDeEQsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVELE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ3pCLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEFTVHYxLCBXYWxrZXJQYXRoIH0gZnJvbSAnQGdsaW1tZXIvc3ludGF4JztcblxuZXhwb3J0IGZ1bmN0aW9uIGFzdE5vZGVIYXNCaW5kaW5nKHRhcmdldDogV2Fsa2VyUGF0aDxBU1R2MS5Ob2RlPiwgbmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGxldCBjdXJzb3I6IFdhbGtlclBhdGg8QVNUdjEuTm9kZT4gfCBudWxsID0gdGFyZ2V0O1xuICB3aGlsZSAoY3Vyc29yKSB7XG4gICAgbGV0IHBhcmVudE5vZGUgPSBjdXJzb3IucGFyZW50Py5ub2RlO1xuICAgIGlmIChcbiAgICAgIHBhcmVudE5vZGU/LnR5cGUgPT09ICdFbGVtZW50Tm9kZScgJiZcbiAgICAgIHBhcmVudE5vZGUuYmxvY2tQYXJhbXMuaW5jbHVkZXMobmFtZSkgJiZcbiAgICAgIC8vIGFuIEVsZW1lbnROb2RlJ3MgYmxvY2sgcGFyYW1zIGFyZSB2YWxpZCBvbmx5IHdpdGhpbiBpdHMgY2hpbGRyZW5cbiAgICAgIHBhcmVudE5vZGUuY2hpbGRyZW4uaW5jbHVkZXMoY3Vyc29yLm5vZGUgYXMgQVNUdjEuU3RhdGVtZW50KVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgcGFyZW50Tm9kZT8udHlwZSA9PT0gJ0Jsb2NrJyAmJlxuICAgICAgcGFyZW50Tm9kZS5ibG9ja1BhcmFtcy5pbmNsdWRlcyhuYW1lKSAmJlxuICAgICAgLy8gYSBCbG9jaydzIGJsb2NrUGFyYW1zIGFyZSB2YWxpZCBvbmx5IHdpdGhpbiBpdHMgYm9keVxuICAgICAgcGFyZW50Tm9kZS5ib2R5LmluY2x1ZGVzKGN1cnNvci5ub2RlIGFzIEFTVHYxLlN0YXRlbWVudClcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGN1cnNvciA9IGN1cnNvci5wYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19