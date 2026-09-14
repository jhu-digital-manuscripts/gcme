"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportUtil = void 0;
class ImportUtil {
    constructor(t, program) {
        this.t = t;
        this.program = program;
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
                return this.addSpecifier(target, declaration, exportedName, nameHint);
            }
        }
        else {
            let declaration = this.insertAfterExistingImports(this.t.importDeclaration([], this.t.stringLiteral(moduleSpecifier)));
            return this.addSpecifier(target, declaration, exportedName, nameHint);
        }
    }
    importForSideEffect(moduleSpecifier) {
        let declaration = this.findImportFrom(moduleSpecifier);
        if (!declaration) {
            this.insertAfterExistingImports(this.t.importDeclaration([], this.t.stringLiteral(moduleSpecifier)));
        }
    }
    addSpecifier(target, declaration, exportedName, nameHint) {
        let local = this.t.identifier(unusedNameLike(target, desiredName(nameHint, exportedName, target)));
        let specifier = this.buildSpecifier(exportedName, local);
        if (specifier.type === 'ImportDefaultSpecifier') {
            declaration.node.specifiers.unshift(specifier);
        }
        else {
            declaration.node.specifiers.push(specifier);
        }
        declaration.scope.registerBinding('module', declaration.get(`specifiers.${declaration.node.specifiers.length - 1}`));
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
function desiredName(nameHint, exportedName, target) {
    if (nameHint) {
        // first we opportunistically do camelization when an illegal character is
        // followed by a lowercase letter, in an effort to aid readability of the
        // output.
        let cleaned = nameHint.replace(/[^a-zA-Z_]([a-z])/g, (_m, letter) => letter.toUpperCase());
        // then we unliterally strip all remaining illegal characters.
        cleaned = cleaned.replace(/[^a-zA-Z_]/g, '');
        return cleaned;
    }
    if (exportedName === 'default' || exportedName === '*') {
        if (target.isIdentifier()) {
            return target.node.name;
        }
        else {
            return target.scope.generateUidIdentifierBasedOnNode(target.node).name;
        }
    }
    else {
        return exportedName;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLQSxNQUFhLFVBQVU7SUFDckIsWUFBb0IsQ0FBYSxFQUFVLE9BQTRCO1FBQW5ELE1BQUMsR0FBRCxDQUFDLENBQVk7UUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFxQjtJQUFHLENBQUM7SUFFM0UsMkVBQTJFO0lBQzNFLG1FQUFtRTtJQUNuRSxZQUFZLENBQUMsZUFBdUIsRUFBRSxZQUFvQjtRQUN4RCxLQUFLLElBQUksWUFBWSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2pELElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQyxFQUFFO2dCQUMvQyxTQUFTO2FBQ1Y7WUFFRCxJQUFJLG1CQUFtQixHQUFHLFlBQVk7aUJBQ25DLEdBQUcsQ0FBQyxZQUFZLENBQUM7aUJBQ2pCLElBQUksQ0FBQyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLElBQUksbUJBQW1CLEVBQUU7Z0JBQ3ZCLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtvQkFDN0MsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO2lCQUN2QjtxQkFBTTtvQkFDTCxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztpQkFDOUI7YUFDRjtTQUNGO0lBQ0gsQ0FBQztJQUVELG9EQUFvRDtJQUNwRCxnQkFBZ0IsQ0FBQyxlQUF1QjtRQUN0QyxLQUFLLElBQUksWUFBWSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2pELElBQUksV0FBVyxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsRUFBRTtnQkFDOUMsWUFBWSxDQUFDLE1BQU0s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QUNMLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDO1NBQ3hFO0tBQ0Y7U0FBTTtRQUNMLE9BQU8sWUFBWSxDQUFDO0tBQ3JCO0FBQ0gsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLElBQW1CLEVBQUUsWUFBb0I7SUFDL0QsUUFBUSxZQUFZLEVBQUU7UUFDcEIsS0FBSyxTQUFTO1lBQ1osT0FBTyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUN6QyxLQUFLLEdBQUc7WUFDTixPQUFPLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1FBQzNDO1lBQ0UsT0FBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxZQUFZLENBQUM7S0FDaEY7QUFDSCxDQUFDO0FBRUQsU0FBUyxXQUFXLENBQ2xCLElBQW1CLEVBQ25CLGVBQXVCO0lBRXZCLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixFQUFFLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLGVBQWUsQ0FBQztBQUN6RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBOb2RlUGF0aCB9IGZyb20gJ0BiYWJlbC90cmF2ZXJzZSc7XG5pbXBvcnQgdHlwZSAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJztcblxudHlwZSBCYWJlbFR5cGVzID0gdHlwZW9mIHQ7XG5cbmV4cG9ydCBjbGFzcyBJbXBvcnRVdGlsIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSB0OiBCYWJlbFR5cGVzLCBwcml2YXRlIHByb2dyYW06IE5vZGVQYXRoPHQuUHJvZ3JhbT4pIHt9XG5cbiAgLy8gcmVtb3ZlIG9uZSBpbXBvcnRlZCBiaW5kaW5nLiBJZiB0aGlzIGlzIHRoZSBsYXN0IHRoaW5nIGltcG9ydGVkIGZyb20gdGhlXG4gIC8vIGdpdmVuIG1vZHVsZVNwZWNpZmllciwgdGhlIHdob2xlIHN0YXRlbWVudCB3aWxsIGFsc28gYmUgcmVtb3ZlZC5cbiAgcmVtb3ZlSW1wb3J0KG1vZHVsZVNwZWNpZmllcjogc3RyaW5nLCBleHBvcnRlZE5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGZvciAobGV0IHRvcExldmVsUGF0aCBvZiB0aGlzLnByb2dyYW0uZ2V0KCdib2R5JykpIHtcbiAgICAgIGlmICghbWF0Y2hNb2R1bGUodG9wTGV2ZWxQYXRoLCBtb2R1bGVTcGVjaWZpZXIpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBsZXQgaW1wb3J0U3BlY2lmaWVyUGF0aCA9IHRvcExldmVsUGF0aFxuICAgICAgICAuZ2V0KCdzcGVjaWZpZXJzJylcbiAgICAgICAgLmZpbmQoKHNwZWNpZmllclBhdGgpID0+IG1hdGNoU3BlY2lmaWVyKHNwZWNpZmllclBhdGgsIGV4cG9ydGVkTmFtZSkpO1xuICAgICAgaWYgKGltcG9ydFNwZWNpZmllclBhdGgpIHtcbiAgICAgICAgaWYgKHRvcExldmVsUGF0aC5ub2RlLnNwZWNpZmllcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgdG9wTGV2ZWxQYXRoLnJlbW92ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGltcG9ydFNwZWNpZmllclBhdGgucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyByZW1vdmUgYWxsIGltcG9ydHMgZnJvbSB0aGUgZ2l2ZW4gbW9kdWxlU3BlY2lmaWVyXG4gIHJlbW92ZUFsbEltcG9ydHMobW9kdWxlU3BlY2lmaWVyOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBmb3IgKGxldCB0b3BMZXZlbFBhdGggb2YgdGhpcy5wcm9ncmFtLmdldCgnYm9keScpKSB7XG4gICAgICBpZiAobWF0Y2hNb2R1bGUodG9wTGV2ZWxQYXRoLCBtb2R1bGVTcGVjaWZpZXIpKSB7XG4gICAgICAgIHRvcExldmVsUGF0aC5yZW1vdmUoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBJbXBvcnQgdGhlIGdpdmVuIHZhbHVlIChpZiBuZWVkZWQpIGFuZCByZXR1cm4gYW4gSWRlbnRpZmllciByZXByZXNlbnRpbmdcbiAgLy8gaXQuXG4gIGltcG9ydChcbiAgICAvLyB0aGUgc3BvdCBhdCB3aGljaCB5b3Ugd2lsbCBpbnNlcnQgdGhlIElkZW50aWZpZXIgd2UgcmV0dXJuIHRvIHlvdVxuICAgIHRhcmdldDogTm9kZVBhdGg8dC5Ob2RlPixcblxuICAgIC8vIHRoZSBwYXRoIHRvIHRoZSBtb2R1bGUgeW91J3JlIGltcG9ydGluZyBmcm9tXG4gICAgbW9kdWxlU3BlY2lmaWVyOiBzdHJpbmcsXG5cbiAgICAvLyB0aGUgbmFtZSB5b3UncmUgaW1wb3J0aW5nIGZyb20gdGhhdCBtb2R1bGUuIFVzZSBcImRlZmF1bHRcIiBmb3IgdGhlIGRlZmF1bHRcbiAgICAvLyBleHBvcnQuIFVzZSBcIipcIiBmb3IgdGhlIG5hbWVzcGFjZS5cbiAgICBleHBvcnRlZE5hbWU6IHN0cmluZyxcblxuICAgIC8vIE9wdGlvbmFsIGhpbnQgZm9yIGhlbHBpbmcgdXMgcGljayBhIG5hbWUgZm9yIHRoZSBpbXBvcnRlZCBiaW5kaW5nXG4gICAgbmFtZUhpbnQ/OiBzdHJpbmdcbiAgKTogdC5JZGVudGlmaWVyIHtcbiAgICBsZXQgaXNOYW1lc3BhY2VJbXBvcnQgPSBleHBvcnRlZE5hbWUgPT09ICcqJztcbiAgICBsZXQgaXNEZWZhdWx0SW1wb3J0ID0gZXhwb3J0ZWROYW1lID09PSAnZGVmYXVsdCc7XG4gICAgbGV0IGlzTmFtZWRJbXBvcnQgPSAhaXNEZWZhdWx0SW1wb3J0ICYmICFpc05hbWVzcGFjZUltcG9ydDtcbiAgICBsZXQgZGVjbGFyYXRpb24gPSB0aGlzLmZpbmRJbXBvcnRGcm9tKG1vZHVsZVNwZWNpZmllcik7XG4gICAgbGV0IGhhc05hbWVzcGFjZVNwZWNpZmllciA9IGRlY2xhcmF0aW9uPy5ub2RlLnNwZWNpZmllcnMuZmluZChcbiAgICAgIChzKSA9PiBzLnR5cGUgPT09ICdJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXInXG4gICAgKTtcbiAgICBsZXQgaGFzTmFtZWRTcGVjaWZpZXJzID0gZGVjbGFyYXRpb24/Lm5vZGUuc3BlY2lmaWVycy5maW5kKChzKSA9PiBzLnR5cGUgPT09ICdJbXBvcnRTcGVjaWZpZXInKTtcblxuICAgIC8qKlxuICAgICAqIHRoZSBmaWxlIGhhcyBhIHByZWV4aXN0aW5nIG5vbi1uYW1lc3BhY2UgaW1wb3J0IGFuZCBhIHRyYW5zZm9ybSB0cmllcyB0byBhZGQgYSBuYW1lc3BhY2UgaW1wb3J0LCBzbyB0aGV5IGRvbid0IGdldCBjb21iaW5lZFxuICAgICAqIHRoZSBmaWxlIGhhcyBhIHByZWV4aXN0aW5nIG5hbWVzcGFjZSBpbXBvcnQgYW5kIGEgdHJhbnNmb3JtIHRyaWVzIHRvIGFkZCBhIG5vbi1uYW1lc3BhY2UgaW1wb3J0LCBzbyB0aGV5IGRvbid0IGdldCBjb21iaW5lZFxuICAgICAqIHRoZSBmaWxlIGhhcyBhIHByZWV4aXN0aW5nIG5hbWVzcGFjZSBpbXBvcnQgYW5kIGEgdHJhbnNmb3JtIHRyaWVzIHRvIGFkZCBhIG5hbWVzcGFjZSBpbXBvcnQsIHNvIHRoZXkgZG9uJ3QgZ2V0IGNvbWJpbmVkXG4gICAgICovXG4gICAgbGV0IGNhbm5vdFVzZUV4aXN0aW5nRGVjbGFyYXRpb24gPVxuICAgICAgKGhhc05hbWVkU3BlY2lmaWVycyAmJiBpc05hbWVzcGFjZUltcG9ydCkgfHxcbiAgICAgIChoYXNOYW1lc3BhY2VTcGVjaWZpZXIgJiYgaXNOYW1lZEltcG9ydCkgfHxcbiAgICAgIChoYXNOYW1lc3BhY2VTcGVjaWZpZXIgJiYgaXNOYW1lc3BhY2VJbXBvcnQpO1xuXG4gICAgaWYgKCFjYW5ub3RVc2VFeGlzdGluZ0RlY2xhcmF0aW9uICYmIGRlY2xhcmF0aW9uKSB7XG4gICAgICBsZXQgc3BlY2lmaWVyID0gZGVjbGFyYXRpb25cbiAgICAgICAgLmdldCgnc3BlY2lmaWVycycpXG4gICAgICAgIC5maW5kKChzcGVjKSA9PiBtYXRjaFNwZWNpZmllcihzcGVjLCBleHBvcnRlZE5hbWUpKTtcbiAgICAgIGlmIChzcGVjaWZpZXIgJiYgdGFyZ2V0LnNjb3BlLmdldEJpbmRpbmcoc3BlY2lmaWVyLm5vZGUubG9jYWwubmFtZSk/LmtpbmQgPT09ICdtb2R1bGUnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnQuaWRlbnRpZmllcihzcGVjaWZpZXIubm9kZS5sb2NhbC5uYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZFNwZWNpZmllcih0YXJnZXQsIGRlY2xhcmF0aW9uLCBleHBvcnRlZE5hbWUsIG5hbWVIaW50KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGRlY2xhcmF0aW9uID0gdGhpcy5pbnNlcnRBZnRlckV4aXN0aW5nSW1wb3J0cyhcbiAgICAgICAgdGhpcy50LmltcG9ydERlY2xhcmF0aW9uKFtdLCB0aGlzLnQuc3RyaW5nTGl0ZXJhbChtb2R1bGVTcGVjaWZpZXIpKVxuICAgICAgKTtcbiAgICAgIHJldHVybiB0aGlzLmFkZFNwZWNpZmllcih0YXJnZXQsIGRlY2xhcmF0aW9uLCBleHBvcnRlZE5hbWUsIG5hbWVIaW50KTtcbiAgICB9XG4gIH1cblxuICBpbXBvcnRGb3JTaWRlRWZmZWN0KG1vZHVsZVNwZWNpZmllcjogc3RyaW5nKTogdm9pZCB7XG4gICAgbGV0IGRlY2xhcmF0aW9uID0gdGhpcy5maW5kSW1wb3J0RnJvbShtb2R1bGVTcGVjaWZpZXIpO1xuICAgIGlmICghZGVjbGFyYXRpb24pIHtcbiAgICAgIHRoaXMuaW5zZXJ0QWZ0ZXJFeGlzdGluZ0ltcG9ydHMoXG4gICAgICAgIHRoaXMudC5pbXBvcnREZWNsYXJhdGlvbihbXSwgdGhpcy50LnN0cmluZ0xpdGVyYWwobW9kdWxlU3BlY2lmaWVyKSlcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhZGRTcGVjaWZpZXIoXG4gICAgdGFyZ2V0OiBOb2RlUGF0aDx0Lk5vZGU+LFxuICAgIGRlY2xhcmF0aW9uOiBOb2RlUGF0aDx0LkltcG9ydERlY2xhcmF0aW9uPixcbiAgICBleHBvcnRlZE5hbWU6IHN0cmluZyxcbiAgICBuYW1lSGludDogc3RyaW5nIHwgdW5kZWZpbmVkXG4gICk6IHQuSWRlbnRpZmllciB7XG4gICAgbGV0IGxvY2FsID0gdGhpcy50LmlkZW50aWZpZXIoXG4gICAgICB1bnVzZWROYW1lTGlrZSh0YXJnZXQsIGRlc2lyZWROYW1lKG5hbWVIaW50LCBleHBvcnRlZE5hbWUsIHRhcmdldCkpXG4gICAgKTtcbiAgICBsZXQgc3BlY2lmaWVyID0gdGhpcy5idWlsZFNwZWNpZmllcihleHBvcnRlZE5hbWUsIGxvY2FsKTtcbiAgICBpZiAoc3BlY2lmaWVyLnR5cGUgPT09ICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJykge1xuICAgICAgZGVjbGFyYXRpb24ubm9kZS5zcGVjaWZpZXJzLnVuc2hpZnQoc3BlY2lmaWVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVjbGFyYXRpb24ubm9kZS5zcGVjaWZpZXJzLnB1c2goc3BlY2lmaWVyKTtcbiAgICB9XG4gICAgZGVjbGFyYXRpb24uc2NvcGUucmVnaXN0ZXJCaW5kaW5nKFxuICAgICAgJ21vZHVsZScsXG4gICAgICBkZWNsYXJhdGlvbi5nZXQoYHNwZWNpZmllcnMuJHtkZWNsYXJhdGlvbi5ub2RlLnNwZWNpZmllcnMubGVuZ3RoIC0gMX1gKSBhcyBOb2RlUGF0aFxuICAgICk7XG4gICAgcmV0dXJuIGxvY2FsO1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZFNwZWNpZmllcihleHBvcnRlZE5hbWU6IHN0cmluZywgbG9jYWxOYW1lOiB0LklkZW50aWZpZXIpIHtcbiAgICBzd2l0Y2ggKGV4cG9ydGVkTmFtZSkge1xuICAgICAgY2FzZSAnZGVmYXVsdCc6XG4gICAgICAgIHJldHVybiB0aGlzLnQuaW1wb3J0RGVmYXVsdFNwZWNpZmllcihsb2NhbE5hbWUpO1xuICAgICAgY2FzZSAnKic6XG4gICAgICAgIHJldHVybiB0aGlzLnQuaW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyKGxvY2FsTmFtZSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcy50LmltcG9ydFNwZWNpZmllcihsb2NhbE5hbWUsIHRoaXMudC5pZGVudGlmaWVyKGV4cG9ydGVkTmFtZSkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluZEltcG9ydEZyb20obW9kdWxlU3BlY2lmaWVyOiBzdHJpbmcpOiBOb2RlUGF0aDx0LkltcG9ydERlY2xhcmF0aW9uPiB8IHVuZGVmaW5lZCB7XG4gICAgZm9yIChsZXQgcGF0aCBvZiB0aGlzLnByb2dyYW0uZ2V0KCdib2R5JykpIHtcbiAgICAgIGlmIChcbiAgICAgICAgcGF0aC5pc0ltcG9ydERlY2xhcmF0aW9uKCkgJiZcbiAgICAgICAgcGF0aC5ub2RlLnNvdXJjZS52YWx1ZSA9PT0gbW9kdWxlU3BlY2lmaWVyICYmXG4gICAgICAgIHBhdGgubm9kZS5pbXBvcnRLaW5kICE9PSAndHlwZSdcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgaW5zZXJ0QWZ0ZXJFeGlzdGluZ0ltcG9ydHM8UyBleHRlbmRzIHQuU3RhdGVtZW50PihzdGF0ZW1lbnQ6IFMpOiBOb2RlUGF0aDxTPiB7XG4gICAgbGV0IGxhc3RJbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgIGZvciAobGV0IFtpbmRleCwgbm9kZV0gb2YgdGhpcy5wcm9ncmFtLm5vZGUuYm9keS5lbnRyaWVzKCkpIHtcbiAgICAgIGlmIChub2RlLnR5cGUgPT09ICdJbXBvcnREZWNsYXJhdGlvbicpIHtcbiAgICAgICAgbGFzdEluZGV4ID0gaW5kZXg7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChsYXN0SW5kZXggPT0gbnVsbCkge1xuICAgICAgLy8gd2UgYXJlIGludGVudGlvbmFsbHkgbm90IHVzaW5nIGJhYmVsJ3MgY29udGFpbmVyLWF3YXJlIG1ldGhvZHMsIGJlY2F1c2VcbiAgICAgIC8vIHdoaWxlIGluIHRoZW9yeSBpdCdzIG5pY2UgdGhhdCB0aGV5IHNjaGVkdWxlIG90aGVyIHBsdWdpbnMgdG8gcnVuIG9uXG4gICAgICAvLyBvdXIgbm9kZXMsIGluIHByYWN0aWNlIHRob3NlIG5vZGVzIG1pZ2h0IGdldCBtdXRhdGVkIG9yIHJlbW92ZWQgYnkgc29tZVxuICAgICAgLy8gb3RoZXIgcGx1Z2luIGluIHRoZSBpbnRlcnZlbmluZyB0aW1lIGNhdXNpbmcgZmFpbHVyZXMuXG4gICAgICB0aGlzLnByb2dyYW0ubm9kZS5ib2R5LnVuc2hpZnQoc3RhdGVtZW50KTtcbiAgICAgIHJldHVybiB0aGlzLnByb2dyYW0uZ2V0KCdib2R5LjAnKSBhcyBOb2RlUGF0aDxTPjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wcm9ncmFtLm5vZGUuYm9keS5zcGxpY2UobGFzdEluZGV4ICsgMSwgMCwgc3RhdGVtZW50KTtcbiAgICAgIHJldHVybiB0aGlzLnByb2dyYW0uZ2V0KGBib2R5LiR7bGFzdEluZGV4ICsgMX1gKSBhcyBOb2RlUGF0aDxTPjtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdW51c2VkTmFtZUxpa2UocGF0aDogTm9kZVBhdGg8dC5Ob2RlPiwgbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IGNhbmRpZGF0ZSA9IG5hbWU7XG4gIGxldCBjb3VudGVyID0gMDtcbiAgd2hpbGUgKHBhdGguc2NvcGUuaGFzQmluZGluZyhjYW5kaWRhdGUpKSB7XG4gICAgY2FuZGlkYXRlID0gYCR7bmFtZX0ke2NvdW50ZXIrK31gO1xuICB9XG4gIHJldHVybiBjYW5kaWRhdGU7XG59XG5cbmZ1bmN0aW9uIG5hbWUobm9kZTogdC5TdHJpbmdMaXRlcmFsIHwgdC5JZGVudGlmaWVyKTogc3RyaW5nIHtcbiAgaWYgKG5vZGUudHlwZSA9PT0gJ1N0cmluZ0xpdGVyYWwnKSB7XG4gICAgcmV0dXJuIG5vZGUudmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5vZGUubmFtZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZXNpcmVkTmFtZShuYW1lSGludDogc3RyaW5nIHwgdW5kZWZpbmVkLCBleHBvcnRlZE5hbWU6IHN0cmluZywgdGFyZ2V0OiBOb2RlUGF0aDx0Lk5vZGU+KSB7XG4gIGlmIChuYW1lSGludCkge1xuICAgIC8vIGZpcnN0IHdlIG9wcG9ydHVuaXN0aWNhbGx5IGRvIGNhbWVsaXphdGlvbiB3aGVuIGFuIGlsbGVnYWwgY2hhcmFjdGVyIGlzXG4gICAgLy8gZm9sbG93ZWQgYnkgYSBsb3dlcmNhc2UgbGV0dGVyLCBpbiBhbiBlZmZvcnQgdG8gYWlkIHJlYWRhYmlsaXR5IG9mIHRoZVxuICAgIC8vIG91dHB1dC5cbiAgICBsZXQgY2xlYW5lZCA9IG5hbWVIaW50LnJlcGxhY2UoL1teYS16QS1aX10oW2Etel0pL2csIChfbSwgbGV0dGVyKSA9PiBsZXR0ZXIudG9VcHBlckNhc2UoKSk7XG4gICAgLy8gdGhlbiB3ZSB1bmxpdGVyYWxseSBzdHJpcCBhbGwgcmVtYWluaW5nIGlsbGVnYWwgY2hhcmFjdGVycy5cbiAgICBjbGVhbmVkID0gY2xlYW5lZC5yZXBsYWNlKC9bXmEtekEtWl9dL2csICcnKTtcbiAgICByZXR1cm4gY2xlYW5lZDtcbiAgfVxuICBpZiAoZXhwb3J0ZWROYW1lID09PSAnZGVmYXVsdCcgfHwgZXhwb3J0ZWROYW1lID09PSAnKicpIHtcbiAgICBpZiAodGFyZ2V0LmlzSWRlbnRpZmllcigpKSB7XG4gICAgICByZXR1cm4gdGFyZ2V0Lm5vZGUubmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRhcmdldC5zY29wZS5nZW5lcmF0ZVVpZElkZW50aWZpZXJCYXNlZE9uTm9kZSh0YXJnZXQubm9kZSkubmFtZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGV4cG9ydGVkTmFtZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaFNwZWNpZmllcihzcGVjOiBOb2RlUGF0aDxhbnk+LCBleHBvcnRlZE5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBzd2l0Y2ggKGV4cG9ydGVkTmFtZSkge1xuICAgIGNhc2UgJ2RlZmF1bHQnOlxuICAgICAgcmV0dXJuIHNwZWMuaXNJbXBvcnREZWZhdWx0U3BlY2lmaWVyKCk7XG4gICAgY2FzZSAnKic6XG4gICAgICByZXR1cm4gc3BlYy5pc0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcigpO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gc3BlYy5pc0ltcG9ydFNwZWNpZmllcigpICYmIG5hbWUoc3BlYy5ub2RlLmltcG9ydGVkKSA9PT0gZXhwb3J0ZWROYW1lO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoTW9kdWxlKFxuICBwYXRoOiBOb2RlUGF0aDxhbnk+LFxuICBtb2R1bGVTcGVjaWZpZXI6IHN0cmluZ1xuKTogcGF0aCBpcyBOb2RlUGF0aDx0LkltcG9ydERlY2xhcmF0aW9uPiB7XG4gIHJldHVybiBwYXRoLmlzSW1wb3J0RGVjbGFyYXRpb24oKSAmJiBwYXRoLmdldCgnc291cmNlJykubm9kZS52YWx1ZSA9PT0gbW9kdWxlU3BlY2lmaWVyO1xufVxuIl19