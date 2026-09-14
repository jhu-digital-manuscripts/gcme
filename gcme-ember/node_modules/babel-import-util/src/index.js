"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportUtil = void 0;
const sanitize_1 = require("./sanitize");
class ImportUtil {
    constructor(babel, program) {
        this.babel = babel;
        this.program = program;
        this.t = babel.types;
    }
    // remove one imported binding. If this is the last thing imported from the
    // given moduleSpecifier, the whole statement will also be removed.
    removeImport(moduleSpecifier, exportedName) {
        for (let topLevelPath of this.program.get('body')) {
            if (!matchModule(topLevelPath, moduleSpecifier)) {
                continue;
            }
            let importSpecifierPath = topLevelPath
                .get('specifiers')
                .find((specifierPath) => matchSpecifier(specifierPath, exportedName));
            if (importSpecifierPath) {
                if (topLevelPath.node.specifiers.length === 1) {
                    topLevelPath.remove();
                }
                else {
                    importSpecifierPath.remove();
                }
            }
        }
    }
    // remove all imports from the given moduleSpecifier
    removeAllImports(moduleSpecifier) {
        for (let topLevelPath of this.program.get('body')) {
            if (matchModule(topLevelPath, moduleSpecifier)) {
                topLevelPath.remove();
            }
        }
    }
    // Import the given value (if needed) and return an Identifier representing
    // it.
    //
    // This method is trickier to use safely than our higher-level methods
    // (`insertAfter`, `insertBefore`, `replaceWith`, `mutate`) because after you
    // insert the identifier into the AST, it's up to you to ensure that babel's
    // scope system is aware of the new reference. The other methods do that for
    // you automatically.
    import(
    // the spot at which you will insert the Identifier we return to you
    target, 
    // the path to the module you're importing from
    moduleSpecifier, 
    // the name you're importing from that module. Use "default" for the default
    // export. Use "*" for the namespace.
    exportedName, 
    // Optional hint for helping us pick a name for the imported binding
    nameHint) {
        return this.unreferencedImport(target, moduleSpecifier, exportedName, desiredName(nameHint, exportedName, defaultNameHint(target)));
    }
    // Import the given value (if needed) and return an Identifier representing
    // it.
    unreferencedImport(
    // the spot at which you will insert the Identifier we return to you
    target, 
    // the path to the module you're importing from
    moduleSpecifier, 
    // the name you're importing from that module. Use "default" for the default
    // export. Use "*" for the namespace.
    exportedName, 
    // the preferred name you want, if we neeed to create a new binding. You
    // might get something similar instead, to avoid collisions.
    preferredName) {
        var _a;
        let isNamespaceImport = exportedName === '*';
        let isDefaultImport = exportedName === 'default';
        let isNamedImport = !isDefaultImport && !isNamespaceImport;
        let declaration = this.findImportFrom(moduleSpecifier);
        let hasNamespaceSpecifier = declaration === null || declaration === void 0 ? void 0 : declaration.node.specifiers.find((s) => s.type === 'ImportNamespaceSpecifier');
        let hasNamedSpecifiers = declaration === null || declaration === void 0 ? void 0 : declaration.node.specifiers.find((s) => s.type === 'ImportSpecifier');
        /**
         * the file has a preexisting non-namespace import and a transform tries to add a namespace import, so they don't get combined
         * the file has a preexisting namespace import and a transform tries to add a non-namespace import, so they don't get combined
         * the file has a preexisting namespace import and a transform tries to add a namespace import, so they don't get combined
         */
        let cannotUseExistingDeclaration = (hasNamedSpecifiers && isNamespaceImport) ||
            (hasNamespaceSpecifier && isNamedImport) ||
            (hasNamespaceSpecifier && isNamespaceImport);
        if (!cannotUseExistingDeclaration && declaration) {
            let specifier = declaration
                .get('specifiers')
                .find((spec) => matchSpecifier(spec, exportedName));
            if (specifier && ((_a = target.scope.getBinding(specifier.node.local.name)) === null || _a === void 0 ? void 0 : _a.kind) === 'module') {
                return this.t.identifier(specifier.node.local.name);
            }
            else {
                return this.addSpecifier(target, declaration, exportedName, preferredName);
            }
        }
        else {
            let declaration = this.insertAfterExistingImports(this.t.importDeclaration([], this.t.stringLiteral(moduleSpecifier)));
            return this.addSpecifier(target, declaration, exportedName, preferredName);
        }
    }
    importForSideEffect(moduleSpecifier) {
        let declaration = this.findImportFrom(moduleSpecifier);
        if (!declaration) {
            this.insertAfterExistingImports(this.t.importDeclaration([], this.t.stringLiteral(moduleSpecifier)));
        }
    }
    replaceWith(target, fn) {
        return this.mutate((i) => {
            target.replaceWith(fn(i));
            // the return value of replaceWith is not a reliable way to get the
            // updated path, at least in the case where the user replaced an
            // expression with a statement. Instead we will rely on the fact that path
            // replacement also mutates its argument, so `target` now points at the
            // newly replaced path.
            return target;
        }, defaultNameHint(target));
    }
    insertAfter(target, fn) {
        return this.mutate((i) => target.insertAfter(fn(i))[0], defaultNameHint(target));
    }
    insertBefore(target, fn) {
        return this.mutate((i) => target.insertBefore(fn(i))[0], defaultNameHint(target));
    }
    // Low-level method for when you don't want to use our higher-level methods
    // (replaceWith, insertBefore, insertAfter)
    mutate(fn, defaultNameHint) {
        let symbols = new Map();
        const importer = {
            import: (moduleSpecifier, exportedName, nameHint) => {
                let identifier = this.t.identifier('__babel_import_util_placeholder__');
                symbols.set(identifier, { moduleSpecifier, exportedName, nameHint });
                return identifier;
            },
        };
        const updateReference = (path) => {
            if (!path.isIdentifier()) {
                return;
            }
            let hit = symbols.get(path.node);
            if (hit) {
                let newIdentifier = this.unreferencedImport(path, hit.moduleSpecifier, hit.exportedName, desiredName(hit.nameHint, hit.exportedName, defaultNameHint));
                path.replaceWith(newIdentifier);
                let binding = path.scope.getBinding(newIdentifier.name);
                if (!binding) {
                    // we create the binding at the point where we add the import, so this
                    // would indicate broken behavior
                    throw new Error(`bug: this is supposed to never happen`);
                }
                binding.reference(path);
            }
        };
        let result = fn(importer);
        updateReference(result);
        this.babel.traverse(result.node, {
            ReferencedIdentifier: (path) => {
                updateReference(path);
            },
        }, result.scope, {}, result);
        return result;
    }
    addSpecifier(target, declaration, exportedName, preferredName) {
        let local = this.t.identifier(unusedNameLike(target, preferredName));
        let specifier = this.buildSpecifier(exportedName, local);
        let added;
        if (specifier.type === 'ImportDefaultSpecifier') {
            declaration.node.specifiers.unshift(specifier);
            added = declaration.get(`specifiers.0`);
        }
        else {
            declaration.node.specifiers.push(specifier);
            added = declaration.get(`specifiers.${declaration.node.specifiers.length - 1}`);
        }
        declaration.scope.registerBinding('module', added);
        return local;
    }
    buildSpecifier(exportedName, localName) {
        switch (exportedName) {
            case 'default':
                return this.t.importDefaultSpecifier(localName);
            case '*':
                return this.t.importNamespaceSpecifier(localName);
            default:
                return this.t.importSpecifier(localName, this.t.identifier(exportedName));
        }
    }
    findImportFrom(moduleSpecifier) {
        for (let path of this.program.get('body')) {
            if (path.isImportDeclaration() &&
                path.node.source.value === moduleSpecifier &&
                path.node.importKind !== 'type') {
                return path;
            }
        }
        return undefined;
    }
    insertAfterExistingImports(statement) {
        let lastIndex;
        for (let [index, node] of this.program.node.body.entries()) {
            if (node.type === 'ImportDeclaration') {
                lastIndex = index;
            }
        }
        if (lastIndex == null) {
            // we are intentionally not using babel's container-aware methods, because
            // while in theory it's nice that they schedule other plugins to run on
            // our nodes, in practice those nodes might get mutated or removed by some
            // other plugin in the intervening time causing failures.
            this.program.node.body.unshift(statement);
            return this.program.get('body.0');
        }
        else {
            this.program.node.body.splice(lastIndex + 1, 0, statement);
            return this.program.get(`body.${lastIndex + 1}`);
        }
    }
}
exports.ImportUtil = ImportUtil;
function unusedNameLike(path, name) {
    let candidate = name;
    let counter = 0;
    while (path.scope.hasBinding(candidate)) {
        candidate = `${name}${counter++}`;
    }
    return candidate;
}
function name(node) {
    if (node.type === 'StringLiteral') {
        return node.value;
    }
    else {
        return node.name;
    }
}
function desiredName(nameHint, exportedName, defaultNameHint) {
    if (nameHint) {
        return (0, sanitize_1.sanitize)(nameHint);
    }
    if (exportedName === 'default' || exportedName === '*') {
        return defaultNameHint !== null && defaultNameHint !== void 0 ? defaultNameHint : 'a';
    }
    else {
        return exportedName;
    }
}
function defaultNameHint(target) {
    if (target === null || target === void 0 ? void 0 : target.isIdentifier()) {
        return target.node.name;
    }
    else if (target) {
        return target.scope.generateUidIdentifierBasedOnNode(target.node).name;
    }
    else {
        return undefined;
    }
}
function matchSpecifier(spec, exportedName) {
    switch (exportedName) {
        case 'default':
            return spec.isImportDefaultSpecifier();
        case '*':
            return spec.isImportNamespaceSpecifier();
        default:
            return spec.isImportSpecifier() && name(spec.node.imported) === exportedName;
    }
}
function matchModule(path, moduleSpecifier) {
    return path.isImportDeclaration() && path.get('source').node.value === moduleSpecifier;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSx5Q0FBc0M7QUFFdEMsTUFBYSxVQUFVO0lBR3JCLFlBQW9CLEtBQW1CLEVBQVUsT0FBNEI7UUFBekQsVUFBSyxHQUFMLEtBQUssQ0FBYztRQUFVLFlBQU8sR0FBUCxPQUFPLENBQXFCO1FBQzNFLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztJQUN2QixDQUFDO0lBRUQsMkVBQTJFO0lBQzNFLG1FQUFtRTtJQUNuRSxZQUFZLENBQUMsZUFBdUIsRUFBRSxZQUFvQjtRQUN4RCxLQUFLLElBQUksWUFBWSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2pELElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQyxFQUFFO2dCQUMvQyxTQUFTO2FBQ1Y7WUFFRCxJQUFJLG1CQUFtQixHQUFHLFlBQVk7aUJBQ25DLEdBQUcsQ0FBQyxZQUFZLENBQUM7aUJBQ2pCLElBQUksQ0FBQyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLElBQUksbUJBQW1CLEVBQUU7Z0JBQ3ZCLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtvQkFDN0MsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO2lCQUN2QjtxQkFBTTtvQkFDTCxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztpQkFDOUI7YUFDRjtTQUNGO0lBQ0gsQ0FBQztJQUVELG9EQUFvRDtJQUNwRCxnQkFBZ0IsQ0FBQyxlQUF1QjtRQUN0QyxLQUFLLElBQUksWUFBWSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2pELElB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SUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7UUFDM0M7WUFDRSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLFlBQVksQ0FBQztLQUNoRjtBQUNILENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FDbEIsSUFBbUIsRUFDbkIsZUFBdUI7SUFFdkIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssZUFBZSxDQUFDO0FBQ3pGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSAqIGFzIEJhYmVsIGZyb20gJ0BiYWJlbC9jb3JlJztcbmltcG9ydCB0eXBlIHsgdHlwZXMgYXMgdCwgTm9kZVBhdGggfSBmcm9tICdAYmFiZWwvY29yZSc7XG5pbXBvcnQgeyBzYW5pdGl6ZSB9IGZyb20gJy4vc2FuaXRpemUnO1xuXG5leHBvcnQgY2xhc3MgSW1wb3J0VXRpbCB7XG4gIHByaXZhdGUgdDogdHlwZW9mIEJhYmVsLnR5cGVzO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYmFiZWw6IHR5cGVvZiBCYWJlbCwgcHJpdmF0ZSBwcm9ncmFtOiBOb2RlUGF0aDx0LlByb2dyYW0+KSB7XG4gICAgdGhpcy50ID0gYmFiZWwudHlwZXM7XG4gIH1cblxuICAvLyByZW1vdmUgb25lIGltcG9ydGVkIGJpbmRpbmcuIElmIHRoaXMgaXMgdGhlIGxhc3QgdGhpbmcgaW1wb3J0ZWQgZnJvbSB0aGVcbiAgLy8gZ2l2ZW4gbW9kdWxlU3BlY2lmaWVyLCB0aGUgd2hvbGUgc3RhdGVtZW50IHdpbGwgYWxzbyBiZSByZW1vdmVkLlxuICByZW1vdmVJbXBvcnQobW9kdWxlU3BlY2lmaWVyOiBzdHJpbmcsIGV4cG9ydGVkTmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgZm9yIChsZXQgdG9wTGV2ZWxQYXRoIG9mIHRoaXMucHJvZ3JhbS5nZXQoJ2JvZHknKSkge1xuICAgICAgaWYgKCFtYXRjaE1vZHVsZSh0b3BMZXZlbFBhdGgsIG1vZHVsZVNwZWNpZmllcikpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGxldCBpbXBvcnRTcGVjaWZpZXJQYXRoID0gdG9wTGV2ZWxQYXRoXG4gICAgICAgIC5nZXQoJ3NwZWNpZmllcnMnKVxuICAgICAgICAuZmluZCgoc3BlY2lmaWVyUGF0aCkgPT4gbWF0Y2hTcGVjaWZpZXIoc3BlY2lmaWVyUGF0aCwgZXhwb3J0ZWROYW1lKSk7XG4gICAgICBpZiAoaW1wb3J0U3BlY2lmaWVyUGF0aCkge1xuICAgICAgICBpZiAodG9wTGV2ZWxQYXRoLm5vZGUuc3BlY2lmaWVycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICB0b3BMZXZlbFBhdGgucmVtb3ZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW1wb3J0U3BlY2lmaWVyUGF0aC5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIHJlbW92ZSBhbGwgaW1wb3J0cyBmcm9tIHRoZSBnaXZlbiBtb2R1bGVTcGVjaWZpZXJcbiAgcmVtb3ZlQWxsSW1wb3J0cyhtb2R1bGVTcGVjaWZpZXI6IHN0cmluZyk6IHZvaWQge1xuICAgIGZvciAobGV0IHRvcExldmVsUGF0aCBvZiB0aGlzLnByb2dyYW0uZ2V0KCdib2R5JykpIHtcbiAgICAgIGlmIChtYXRjaE1vZHVsZSh0b3BMZXZlbFBhdGgsIG1vZHVsZVNwZWNpZmllcikpIHtcbiAgICAgICAgdG9wTGV2ZWxQYXRoLnJlbW92ZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEltcG9ydCB0aGUgZ2l2ZW4gdmFsdWUgKGlmIG5lZWRlZCkgYW5kIHJldHVybiBhbiBJZGVudGlmaWVyIHJlcHJlc2VudGluZ1xuICAvLyBpdC5cbiAgLy9cbiAgLy8gVGhpcyBtZXRob2QgaXMgdHJpY2tpZXIgdG8gdXNlIHNhZmVseSB0aGFuIG91ciBoaWdoZXItbGV2ZWwgbWV0aG9kc1xuICAvLyAoYGluc2VydEFmdGVyYCwgYGluc2VydEJlZm9yZWAsIGByZXBsYWNlV2l0aGAsIGBtdXRhdGVgKSBiZWNhdXNlIGFmdGVyIHlvdVxuICAvLyBpbnNlcnQgdGhlIGlkZW50aWZpZXIgaW50byB0aGUgQVNULCBpdCdzIHVwIHRvIHlvdSB0byBlbnN1cmUgdGhhdCBiYWJlbCdzXG4gIC8vIHNjb3BlIHN5c3RlbSBpcyBhd2FyZSBvZiB0aGUgbmV3IHJlZmVyZW5jZS4gVGhlIG90aGVyIG1ldGhvZHMgZG8gdGhhdCBmb3JcbiAgLy8geW91IGF1dG9tYXRpY2FsbHkuXG4gIGltcG9ydChcbiAgICAvLyB0aGUgc3BvdCBhdCB3aGljaCB5b3Ugd2lsbCBpbnNlcnQgdGhlIElkZW50aWZpZXIgd2UgcmV0dXJuIHRvIHlvdVxuICAgIHRhcmdldDogTm9kZVBhdGg8dC5Ob2RlPixcblxuICAgIC8vIHRoZSBwYXRoIHRvIHRoZSBtb2R1bGUgeW91J3JlIGltcG9ydGluZyBmcm9tXG4gICAgbW9kdWxlU3BlY2lmaWVyOiBzdHJpbmcsXG5cbiAgICAvLyB0aGUgbmFtZSB5b3UncmUgaW1wb3J0aW5nIGZyb20gdGhhdCBtb2R1bGUuIFVzZSBcImRlZmF1bHRcIiBmb3IgdGhlIGRlZmF1bHRcbiAgICAvLyBleHBvcnQuIFVzZSBcIipcIiBmb3IgdGhlIG5hbWVzcGFjZS5cbiAgICBleHBvcnRlZE5hbWU6IHN0cmluZyxcblxuICAgIC8vIE9wdGlvbmFsIGhpbnQgZm9yIGhlbHBpbmcgdXMgcGljayBhIG5hbWUgZm9yIHRoZSBpbXBvcnRlZCBiaW5kaW5nXG4gICAgbmFtZUhpbnQ/OiBzdHJpbmdcbiAgKTogdC5JZGVudGlmaWVyIHtcbiAgICByZXR1cm4gdGhpcy51bnJlZmVyZW5jZWRJbXBvcnQoXG4gICAgICB0YXJnZXQsXG4gICAgICBtb2R1bGVTcGVjaWZpZXIsXG4gICAgICBleHBvcnRlZE5hbWUsXG4gICAgICBkZXNpcmVkTmFtZShuYW1lSGludCwgZXhwb3J0ZWROYW1lLCBkZWZhdWx0TmFtZUhpbnQodGFyZ2V0KSlcbiAgICApO1xuICB9XG5cbiAgLy8gSW1wb3J0IHRoZSBnaXZlbiB2YWx1ZSAoaWYgbmVlZGVkKSBhbmQgcmV0dXJuIGFuIElkZW50aWZpZXIgcmVwcmVzZW50aW5nXG4gIC8vIGl0LlxuICBwcml2YXRlIHVucmVmZXJlbmNlZEltcG9ydChcbiAgICAvLyB0aGUgc3BvdCBhdCB3aGljaCB5b3Ugd2lsbCBpbnNlcnQgdGhlIElkZW50aWZpZXIgd2UgcmV0dXJuIHRvIHlvdVxuICAgIHRhcmdldDogTm9kZVBhdGg8dC5Ob2RlPixcblxuICAgIC8vIHRoZSBwYXRoIHRvIHRoZSBtb2R1bGUgeW91J3JlIGltcG9ydGluZyBmcm9tXG4gICAgbW9kdWxlU3BlY2lmaWVyOiBzdHJpbmcsXG5cbiAgICAvLyB0aGUgbmFtZSB5b3UncmUgaW1wb3J0aW5nIGZyb20gdGhhdCBtb2R1bGUuIFVzZSBcImRlZmF1bHRcIiBmb3IgdGhlIGRlZmF1bHRcbiAgICAvLyBleHBvcnQuIFVzZSBcIipcIiBmb3IgdGhlIG5hbWVzcGFjZS5cbiAgICBleHBvcnRlZE5hbWU6IHN0cmluZyxcblxuICAgIC8vIHRoZSBwcmVmZXJyZWQgbmFtZSB5b3Ugd2FudCwgaWYgd2UgbmVlZWQgdG8gY3JlYXRlIGEgbmV3IGJpbmRpbmcuIFlvdVxuICAgIC8vIG1pZ2h0IGdldCBzb21ldGhpbmcgc2ltaWxhciBpbnN0ZWFkLCB0byBhdm9pZCBjb2xsaXNpb25zLlxuICAgIHByZWZlcnJlZE5hbWU6IHN0cmluZ1xuICApOiB0LklkZW50aWZpZXIge1xuICAgIGxldCBpc05hbWVzcGFjZUltcG9ydCA9IGV4cG9ydGVkTmFtZSA9PT0gJyonO1xuICAgIGxldCBpc0RlZmF1bHRJbXBvcnQgPSBleHBvcnRlZE5hbWUgPT09ICdkZWZhdWx0JztcbiAgICBsZXQgaXNOYW1lZEltcG9ydCA9ICFpc0RlZmF1bHRJbXBvcnQgJiYgIWlzTmFtZXNwYWNlSW1wb3J0O1xuICAgIGxldCBkZWNsYXJhdGlvbiA9IHRoaXMuZmluZEltcG9ydEZyb20obW9kdWxlU3BlY2lmaWVyKTtcbiAgICBsZXQgaGFzTmFtZXNwYWNlU3BlY2lmaWVyID0gZGVjbGFyYXRpb24/Lm5vZGUuc3BlY2lmaWVycy5maW5kKFxuICAgICAgKHMpID0+IHMudHlwZSA9PT0gJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcidcbiAgICApO1xuICAgIGxldCBoYXNOYW1lZFNwZWNpZmllcnMgPSBkZWNsYXJhdGlvbj8ubm9kZS5zcGVjaWZpZXJzLmZpbmQoKHMpID0+IHMudHlwZSA9PT0gJ0ltcG9ydFNwZWNpZmllcicpO1xuXG4gICAgLyoqXG4gICAgICogdGhlIGZpbGUgaGFzIGEgcHJlZXhpc3Rpbmcgbm9uLW5hbWVzcGFjZSBpbXBvcnQgYW5kIGEgdHJhbnNmb3JtIHRyaWVzIHRvIGFkZCBhIG5hbWVzcGFjZSBpbXBvcnQsIHNvIHRoZXkgZG9uJ3QgZ2V0IGNvbWJpbmVkXG4gICAgICogdGhlIGZpbGUgaGFzIGEgcHJlZXhpc3RpbmcgbmFtZXNwYWNlIGltcG9ydCBhbmQgYSB0cmFuc2Zvcm0gdHJpZXMgdG8gYWRkIGEgbm9uLW5hbWVzcGFjZSBpbXBvcnQsIHNvIHRoZXkgZG9uJ3QgZ2V0IGNvbWJpbmVkXG4gICAgICogdGhlIGZpbGUgaGFzIGEgcHJlZXhpc3RpbmcgbmFtZXNwYWNlIGltcG9ydCBhbmQgYSB0cmFuc2Zvcm0gdHJpZXMgdG8gYWRkIGEgbmFtZXNwYWNlIGltcG9ydCwgc28gdGhleSBkb24ndCBnZXQgY29tYmluZWRcbiAgICAgKi9cbiAgICBsZXQgY2Fubm90VXNlRXhpc3RpbmdEZWNsYXJhdGlvbiA9XG4gICAgICAoaGFzTmFtZWRTcGVjaWZpZXJzICYmIGlzTmFtZXNwYWNlSW1wb3J0KSB8fFxuICAgICAgKGhhc05hbWVzcGFjZVNwZWNpZmllciAmJiBpc05hbWVkSW1wb3J0KSB8fFxuICAgICAgKGhhc05hbWVzcGFjZVNwZWNpZmllciAmJiBpc05hbWVzcGFjZUltcG9ydCk7XG5cbiAgICBpZiAoIWNhbm5vdFVzZUV4aXN0aW5nRGVjbGFyYXRpb24gJiYgZGVjbGFyYXRpb24pIHtcbiAgICAgIGxldCBzcGVjaWZpZXIgPSBkZWNsYXJhdGlvblxuICAgICAgICAuZ2V0KCdzcGVjaWZpZXJzJylcbiAgICAgICAgLmZpbmQoKHNwZWMpID0+IG1hdGNoU3BlY2lmaWVyKHNwZWMsIGV4cG9ydGVkTmFtZSkpO1xuICAgICAgaWYgKHNwZWNpZmllciAmJiB0YXJnZXQuc2NvcGUuZ2V0QmluZGluZyhzcGVjaWZpZXIubm9kZS5sb2NhbC5uYW1lKT8ua2luZCA9PT0gJ21vZHVsZScpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudC5pZGVudGlmaWVyKHNwZWNpZmllci5ub2RlLmxvY2FsLm5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkU3BlY2lmaWVyKHRhcmdldCwgZGVjbGFyYXRpb24sIGV4cG9ydGVkTmFtZSwgcHJlZmVycmVkTmFtZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBkZWNsYXJhdGlvbiA9IHRoaXMuaW5zZXJ0QWZ0ZXJFeGlzdGluZ0ltcG9ydHMoXG4gICAgICAgIHRoaXMudC5pbXBvcnREZWNsYXJhdGlvbihbXSwgdGhpcy50LnN0cmluZ0xpdGVyYWwobW9kdWxlU3BlY2lmaWVyKSlcbiAgICAgICk7XG4gICAgICByZXR1cm4gdGhpcy5hZGRTcGVjaWZpZXIodGFyZ2V0LCBkZWNsYXJhdGlvbiwgZXhwb3J0ZWROYW1lLCBwcmVmZXJyZWROYW1lKTtcbiAgICB9XG4gIH1cblxuICBpbXBvcnRGb3JTaWRlRWZmZWN0KG1vZHVsZVNwZWNpZmllcjogc3RyaW5nKTogdm9pZCB7XG4gICAgbGV0IGRlY2xhcmF0aW9uID0gdGhpcy5maW5kSW1wb3J0RnJvbShtb2R1bGVTcGVjaWZpZXIpO1xuICAgIGlmICghZGVjbGFyYXRpb24pIHtcbiAgICAgIHRoaXMuaW5zZXJ0QWZ0ZXJFeGlzdGluZ0ltcG9ydHMoXG4gICAgICAgIHRoaXMudC5pbXBvcnREZWNsYXJhdGlvbihbXSwgdGhpcy50LnN0cmluZ0xpdGVyYWwobW9kdWxlU3BlY2lmaWVyKSlcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcmVwbGFjZVdpdGg8VCBleHRlbmRzIHQuTm9kZSwgUiBleHRlbmRzIHQuTm9kZT4oXG4gICAgdGFyZ2V0OiBOb2RlUGF0aDxUPixcbiAgICBmbjogKGk6IEltcG9ydGVyKSA9PiBSXG4gICk6IE5vZGVQYXRoPFI+IHtcbiAgICByZXR1cm4gdGhpcy5tdXRhdGUoKGkpID0+IHtcbiAgICAgIHRhcmdldC5yZXBsYWNlV2l0aChmbihpKSk7XG4gICAgICAvLyB0aGUgcmV0dXJuIHZhbHVlIG9mIHJlcGxhY2VXaXRoIGlzIG5vdCBhIHJlbGlhYmxlIHdheSB0byBnZXQgdGhlXG4gICAgICAvLyB1cGRhdGVkIHBhdGgsIGF0IGxlYXN0IGluIHRoZSBjYXNlIHdoZXJlIHRoZSB1c2VyIHJlcGxhY2VkIGFuXG4gICAgICAvLyBleHByZXNzaW9uIHdpdGggYSBzdGF0ZW1lbnQuIEluc3RlYWQgd2Ugd2lsbCByZWx5IG9uIHRoZSBmYWN0IHRoYXQgcGF0aFxuICAgICAgLy8gcmVwbGFjZW1lbnQgYWxzbyBtdXRhdGVzIGl0cyBhcmd1bWVudCwgc28gYHRhcmdldGAgbm93IHBvaW50cyBhdCB0aGVcbiAgICAgIC8vIG5ld2x5IHJlcGxhY2VkIHBhdGguXG4gICAgICByZXR1cm4gdGFyZ2V0IGFzIHVua25vd24gYXMgTm9kZVBhdGg8Uj47XG4gICAgfSwgZGVmYXVsdE5hbWVIaW50KHRhcmdldCkpO1xuICB9XG5cbiAgaW5zZXJ0QWZ0ZXI8VCBleHRlbmRzIHQuTm9kZSwgUiBleHRlbmRzIHQuTm9kZT4oXG4gICAgdGFyZ2V0OiBOb2RlUGF0aDxUPixcbiAgICBmbjogKGk6IEltcG9ydGVyKSA9PiBSXG4gICk6IE5vZGVQYXRoPFI+IHtcbiAgICByZXR1cm4gdGhpcy5tdXRhdGUoKGkpID0+IHRhcmdldC5pbnNlcnRBZnRlcihmbihpKSlbMF0gYXMgTm9kZVBhdGg8Uj4sIGRlZmF1bHROYW1lSGludCh0YXJnZXQpKTtcbiAgfVxuXG4gIGluc2VydEJlZm9yZTxUIGV4dGVuZHMgdC5Ob2RlLCBSIGV4dGVuZHMgdC5Ob2RlPihcbiAgICB0YXJnZXQ6IE5vZGVQYXRoPFQ+LFxuICAgIGZuOiAoaTogSW1wb3J0ZXIpID0+IFJcbiAgKTogTm9kZVBhdGg8Uj4ge1xuICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgIChpKSA9PiB0YXJnZXQuaW5zZXJ0QmVmb3JlKGZuKGkpKVswXSBhcyBOb2RlUGF0aDxSPixcbiAgICAgIGRlZmF1bHROYW1lSGludCh0YXJnZXQpXG4gICAgKTtcbiAgfVxuXG4gIC8vIExvdy1sZXZlbCBtZXRob2QgZm9yIHdoZW4geW91IGRvbid0IHdhbnQgdG8gdXNlIG91ciBoaWdoZXItbGV2ZWwgbWV0aG9kc1xuICAvLyAocmVwbGFjZVdpdGgsIGluc2VydEJlZm9yZSwgaW5zZXJ0QWZ0ZXIpXG4gIG11dGF0ZTxSZXBsYWNlbWVudCBleHRlbmRzIHQuTm9kZT4oXG4gICAgZm46IChpbXBvcnRlcjogSW1wb3J0ZXIpID0+IE5vZGVQYXRoPFJlcGxhY2VtZW50PixcbiAgICBkZWZhdWx0TmFtZUhpbnQ/OiBzdHJpbmdcbiAgKTogTm9kZVBhdGg8UmVwbGFjZW1lbnQ+IHtcbiAgICBsZXQgc3ltYm9sczogTWFwPFxuICAgICAgdC5JZGVudGlmaWVyLFxuICAgICAgeyBtb2R1bGVTcGVjaWZpZXI6IHN0cmluZzsgZXhwb3J0ZWROYW1lOiBzdHJpbmc7IG5hbWVIaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgfVxuICAgID4gPSBuZXcgTWFwKCk7XG4gICAgY29uc3QgaW1wb3J0ZXI6IEltcG9ydGVyID0ge1xuICAgICAgaW1wb3J0OiAobW9kdWxlU3BlY2lmaWVyOiBzdHJpbmcsIGV4cG9ydGVkTmFtZTogc3RyaW5nLCBuYW1lSGludD86IHN0cmluZykgPT4ge1xuICAgICAgICBsZXQgaWRlbnRpZmllciA9IHRoaXMudC5pZGVudGlmaWVyKCdfX2JhYmVsX2ltcG9ydF91dGlsX3BsYWNlaG9sZGVyX18nKTtcbiAgICAgICAgc3ltYm9scy5zZXQoaWRlbnRpZmllciwgeyBtb2R1bGVTcGVjaWZpZXIsIGV4cG9ydGVkTmFtZSwgbmFtZUhpbnQgfSk7XG4gICAgICAgIHJldHVybiBpZGVudGlmaWVyO1xuICAgICAgfSxcbiAgICB9O1xuXG4gICAgY29uc3QgdXBkYXRlUmVmZXJlbmNlID0gKHBhdGg6IE5vZGVQYXRoKSA9PiB7XG4gICAgICBpZiAoIXBhdGguaXNJZGVudGlmaWVyKCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbGV0IGhpdCA9IHN5bWJvbHMuZ2V0KHBhdGgubm9kZSk7XG4gICAgICBpZiAoaGl0KSB7XG4gICAgICAgIGxldCBuZXdJZGVudGlmaWVyID0gdGhpcy51bnJlZmVyZW5jZWRJbXBvcnQoXG4gICAgICAgICAgcGF0aCxcbiAgICAgICAgICBoaXQubW9kdWxlU3BlY2lmaWVyLFxuICAgICAgICAgIGhpdC5leHBvcnRlZE5hbWUsXG4gICAgICAgICAgZGVzaXJlZE5hbWUoaGl0Lm5hbWVIaW50LCBoaXQuZXhwb3J0ZWROYW1lLCBkZWZhdWx0TmFtZUhpbnQpXG4gICAgICAgICk7XG4gICAgICAgIHBhdGgucmVwbGFjZVdpdGgobmV3SWRlbnRpZmllcik7XG4gICAgICAgIGxldCBiaW5kaW5nID0gcGF0aC5zY29wZS5nZXRCaW5kaW5nKG5ld0lkZW50aWZpZXIubmFtZSk7XG4gICAgICAgIGlmICghYmluZGluZykge1xuICAgICAgICAgIC8vIHdlIGNyZWF0ZSB0aGUgYmluZGluZyBhdCB0aGUgcG9pbnQgd2hlcmUgd2UgYWRkIHRoZSBpbXBvcnQsIHNvIHRoaXNcbiAgICAgICAgICAvLyB3b3VsZCBpbmRpY2F0ZSBicm9rZW4gYmVoYXZpb3JcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGJ1ZzogdGhpcyBpcyBzdXBwb3NlZCB0byBuZXZlciBoYXBwZW5gKTtcbiAgICAgICAgfVxuICAgICAgICBiaW5kaW5nLnJlZmVyZW5jZShwYXRoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbGV0IHJlc3VsdCA9IGZuKGltcG9ydGVyKTtcbiAgICB1cGRhdGVSZWZlcmVuY2UocmVzdWx0KTtcbiAgICB0aGlzLmJhYmVsLnRyYXZlcnNlKFxuICAgICAgcmVzdWx0Lm5vZGUsXG4gICAgICB7XG4gICAgICAgIFJlZmVyZW5jZWRJZGVudGlmaWVyOiAocGF0aCkgPT4ge1xuICAgICAgICAgIHVwZGF0ZVJlZmVyZW5jZShwYXRoKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICByZXN1bHQuc2NvcGUsXG4gICAgICB7fSxcbiAgICAgIHJlc3VsdFxuICAgICk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgYWRkU3BlY2lmaWVyKFxuICAgIHRhcmdldDogTm9kZVBhdGg8dC5Ob2RlPixcbiAgICBkZWNsYXJhdGlvbjogTm9kZVBhdGg8dC5JbXBvcnREZWNsYXJhdGlvbj4sXG4gICAgZXhwb3J0ZWROYW1lOiBzdHJpbmcsXG4gICAgcHJlZmVycmVkTmFtZTogc3RyaW5nXG4gICk6IHQuSWRlbnRpZmllciB7XG4gICAgbGV0IGxvY2FsID0gdGhpcy50LmlkZW50aWZpZXIodW51c2VkTmFtZUxpa2UodGFyZ2V0LCBwcmVmZXJyZWROYW1lKSk7XG4gICAgbGV0IHNwZWNpZmllciA9IHRoaXMuYnVpbGRTcGVjaWZpZXIoZXhwb3J0ZWROYW1lLCBsb2NhbCk7XG4gICAgbGV0IGFkZGVkOiBOb2RlUGF0aDtcbiAgICBpZiAoc3BlY2lmaWVyLnR5cGUgPT09ICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJykge1xuICAgICAgZGVjbGFyYXRpb24ubm9kZS5zcGVjaWZpZXJzLnVuc2hpZnQoc3BlY2lmaWVyKTtcbiAgICAgIGFkZGVkID0gZGVjbGFyYXRpb24uZ2V0KGBzcGVjaWZpZXJzLjBgKSBhcyBOb2RlUGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVjbGFyYXRpb24ubm9kZS5zcGVjaWZpZXJzLnB1c2goc3BlY2lmaWVyKTtcbiAgICAgIGFkZGVkID0gZGVjbGFyYXRpb24uZ2V0KGBzcGVjaWZpZXJzLiR7ZGVjbGFyYXRpb24ubm9kZS5zcGVjaWZpZXJzLmxlbmd0aCAtIDF9YCkgYXMgTm9kZVBhdGg7XG4gICAgfVxuICAgIGRlY2xhcmF0aW9uLnNjb3BlLnJlZ2lzdGVyQmluZGluZygnbW9kdWxlJywgYWRkZWQpO1xuICAgIHJldHVybiBsb2NhbDtcbiAgfVxuXG4gIHByaXZhdGUgYnVpbGRTcGVjaWZpZXIoZXhwb3J0ZWROYW1lOiBzdHJpbmcsIGxvY2FsTmFtZTogdC5JZGVudGlmaWVyKSB7XG4gICAgc3dpdGNoIChleHBvcnRlZE5hbWUpIHtcbiAgICAgIGNhc2UgJ2RlZmF1bHQnOlxuICAgICAgICByZXR1cm4gdGhpcy50LmltcG9ydERlZmF1bHRTcGVjaWZpZXIobG9jYWxOYW1lKTtcbiAgICAgIGNhc2UgJyonOlxuICAgICAgICByZXR1cm4gdGhpcy50LmltcG9ydE5hbWVzcGFjZVNwZWNpZmllcihsb2NhbE5hbWUpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMudC5pbXBvcnRTcGVjaWZpZXIobG9jYWxOYW1lLCB0aGlzLnQuaWRlbnRpZmllcihleHBvcnRlZE5hbWUpKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmRJbXBvcnRGcm9tKG1vZHVsZVNwZWNpZmllcjogc3RyaW5nKTogTm9kZVBhdGg8dC5JbXBvcnREZWNsYXJhdGlvbj4gfCB1bmRlZmluZWQge1xuICAgIGZvciAobGV0IHBhdGggb2YgdGhpcy5wcm9ncmFtLmdldCgnYm9keScpKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHBhdGguaXNJbXBvcnREZWNsYXJhdGlvbigpICYmXG4gICAgICAgIHBhdGgubm9kZS5zb3VyY2UudmFsdWUgPT09IG1vZHVsZVNwZWNpZmllciAmJlxuICAgICAgICBwYXRoLm5vZGUuaW1wb3J0S2luZCAhPT0gJ3R5cGUnXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIGluc2VydEFmdGVyRXhpc3RpbmdJbXBvcnRzPFMgZXh0ZW5kcyB0LlN0YXRlbWVudD4oc3RhdGVtZW50OiBTKTogTm9kZVBhdGg8Uz4ge1xuICAgIGxldCBsYXN0SW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICBmb3IgKGxldCBbaW5kZXgsIG5vZGVdIG9mIHRoaXMucHJvZ3JhbS5ub2RlLmJvZHkuZW50cmllcygpKSB7XG4gICAgICBpZiAobm9kZS50eXBlID09PSAnSW1wb3J0RGVjbGFyYXRpb24nKSB7XG4gICAgICAgIGxhc3RJbmRleCA9IGluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobGFzdEluZGV4ID09IG51bGwpIHtcbiAgICAgIC8vIHdlIGFyZSBpbnRlbnRpb25hbGx5IG5vdCB1c2luZyBiYWJlbCdzIGNvbnRhaW5lci1hd2FyZSBtZXRob2RzLCBiZWNhdXNlXG4gICAgICAvLyB3aGlsZSBpbiB0aGVvcnkgaXQncyBuaWNlIHRoYXQgdGhleSBzY2hlZHVsZSBvdGhlciBwbHVnaW5zIHRvIHJ1biBvblxuICAgICAgLy8gb3VyIG5vZGVzLCBpbiBwcmFjdGljZSB0aG9zZSBub2RlcyBtaWdodCBnZXQgbXV0YXRlZCBvciByZW1vdmVkIGJ5IHNvbWVcbiAgICAgIC8vIG90aGVyIHBsdWdpbiBpbiB0aGUgaW50ZXJ2ZW5pbmcgdGltZSBjYXVzaW5nIGZhaWx1cmVzLlxuICAgICAgdGhpcy5wcm9ncmFtLm5vZGUuYm9keS51bnNoaWZ0KHN0YXRlbWVudCk7XG4gICAgICByZXR1cm4gdGhpcy5wcm9ncmFtLmdldCgnYm9keS4wJykgYXMgTm9kZVBhdGg8Uz47XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHJvZ3JhbS5ub2RlLmJvZHkuc3BsaWNlKGxhc3RJbmRleCArIDEsIDAsIHN0YXRlbWVudCk7XG4gICAgICByZXR1cm4gdGhpcy5wcm9ncmFtLmdldChgYm9keS4ke2xhc3RJbmRleCArIDF9YCkgYXMgTm9kZVBhdGg8Uz47XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHVudXNlZE5hbWVMaWtlKHBhdGg6IE5vZGVQYXRoPHQuTm9kZT4sIG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBjYW5kaWRhdGUgPSBuYW1lO1xuICBsZXQgY291bnRlciA9IDA7XG4gIHdoaWxlIChwYXRoLnNjb3BlLmhhc0JpbmRpbmcoY2FuZGlkYXRlKSkge1xuICAgIGNhbmRpZGF0ZSA9IGAke25hbWV9JHtjb3VudGVyKyt9YDtcbiAgfVxuICByZXR1cm4gY2FuZGlkYXRlO1xufVxuXG5mdW5jdGlvbiBuYW1lKG5vZGU6IHQuU3RyaW5nTGl0ZXJhbCB8IHQuSWRlbnRpZmllcik6IHN0cmluZyB7XG4gIGlmIChub2RlLnR5cGUgPT09ICdTdHJpbmdMaXRlcmFsJykge1xuICAgIHJldHVybiBub2RlLnZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBub2RlLm5hbWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVzaXJlZE5hbWUoXG4gIG5hbWVIaW50OiBzdHJpbmcgfCB1bmRlZmluZWQsXG4gIGV4cG9ydGVkTmFtZTogc3RyaW5nLFxuICBkZWZhdWx0TmFtZUhpbnQ6IHN0cmluZyB8IHVuZGVmaW5lZFxuKSB7XG4gIGlmIChuYW1lSGludCkge1xuICAgIHJldHVybiBzYW5pdGl6ZShuYW1lSGludCk7XG4gIH1cbiAgaWYgKGV4cG9ydGVkTmFtZSA9PT0gJ2RlZmF1bHQnIHx8IGV4cG9ydGVkTmFtZSA9PT0gJyonKSB7XG4gICAgcmV0dXJuIGRlZmF1bHROYW1lSGludCA/PyAnYSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGV4cG9ydGVkTmFtZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWZhdWx0TmFtZUhpbnQodGFyZ2V0OiBOb2RlUGF0aCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGlmICh0YXJnZXQ/LmlzSWRlbnRpZmllcigpKSB7XG4gICAgcmV0dXJuIHRhcmdldC5ub2RlLm5hbWU7XG4gIH0gZWxzZSBpZiAodGFyZ2V0KSB7XG4gICAgcmV0dXJuIHRhcmdldC5zY29wZS5nZW5lcmF0ZVVpZElkZW50aWZpZXJCYXNlZE9uTm9kZSh0YXJnZXQubm9kZSkubmFtZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoU3BlY2lmaWVyKHNwZWM6IE5vZGVQYXRoPGFueT4sIGV4cG9ydGVkTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHN3aXRjaCAoZXhwb3J0ZWROYW1lKSB7XG4gICAgY2FzZSAnZGVmYXVsdCc6XG4gICAgICByZXR1cm4gc3BlYy5pc0ltcG9ydERlZmF1bHRTcGVjaWZpZXIoKTtcbiAgICBjYXNlICcqJzpcbiAgICAgIHJldHVybiBzcGVjLmlzSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyKCk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBzcGVjLmlzSW1wb3J0U3BlY2lmaWVyKCkgJiYgbmFtZShzcGVjLm5vZGUuaW1wb3J0ZWQpID09PSBleHBvcnRlZE5hbWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWF0Y2hNb2R1bGUoXG4gIHBhdGg6IE5vZGVQYXRoPGFueT4sXG4gIG1vZHVsZVNwZWNpZmllcjogc3RyaW5nXG4pOiBwYXRoIGlzIE5vZGVQYXRoPHQuSW1wb3J0RGVjbGFyYXRpb24+IHtcbiAgcmV0dXJuIHBhdGguaXNJbXBvcnREZWNsYXJhdGlvbigpICYmIHBhdGguZ2V0KCdzb3VyY2UnKS5ub2RlLnZhbHVlID09PSBtb2R1bGVTcGVjaWZpZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1wb3J0ZXIge1xuICAvLyBJbXBvcnQgdGhlIGdpdmVuIHZhbHVlIChpZiBuZWVkZWQpIGFuZCByZXR1cm4gYW4gSWRlbnRpZmllciByZXByZXNlbnRpbmdcbiAgLy8gaXQuXG4gIGltcG9ydChcbiAgICAvLyB0aGUgcGF0aCB0byB0aGUgbW9kdWxlIHlvdSdyZSBpbXBvcnRpbmcgZnJvbVxuICAgIG1vZHVsZVNwZWNpZmllcjogc3RyaW5nLFxuXG4gICAgLy8gdGhlIG5hbWUgeW91J3JlIGltcG9ydGluZyBmcm9tIHRoYXQgbW9kdWxlLiBVc2UgXCJkZWZhdWx0XCIgZm9yIHRoZSBkZWZhdWx0XG4gICAgLy8gZXhwb3J0LiBVc2UgXCIqXCIgZm9yIHRoZSBuYW1lc3BhY2UuXG4gICAgZXhwb3J0ZWROYW1lOiBzdHJpbmcsXG5cbiAgICAvLyBPcHRpb25hbCBoaW50IGZvciBoZWxwaW5nIHVzIHBpY2sgYSBuYW1lIGZvciB0aGUgaW1wb3J0ZWQgYmluZGluZ1xuICAgIG5hbWVIaW50Pzogc3RyaW5nXG4gICk6IHQuSWRlbnRpZmllcjtcbn1cbiJdfQ==