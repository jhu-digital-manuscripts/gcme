"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDeepAddonInstance = isDeepAddonInstance;
exports.findTopmostAddon = findTopmostAddon;
function isDeepAddonInstance(addon) {
    return addon.parent !== addon.project;
}
function findTopmostAddon(addon) {
    if (isDeepAddonInstance(addon)) {
        return findTopmostAddon(addon.parent);
    }
    else {
        return addon;
    }
}
//# sourceMappingURL=ember-cli-models.js.map