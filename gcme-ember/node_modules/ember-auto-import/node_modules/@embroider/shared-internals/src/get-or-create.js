"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreate = getOrCreate;
function getOrCreate(map, key, construct) {
    let result = map.get(key);
    if (!result) {
        result = construct(key);
        map.set(key, result);
    }
    return result;
}
//# sourceMappingURL=get-or-create.js.map