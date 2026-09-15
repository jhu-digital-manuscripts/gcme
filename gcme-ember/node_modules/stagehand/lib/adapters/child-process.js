"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpointForChildProcess = exports.endpointForParentProcess = exports.connect = exports.launch = void 0;
const __1 = require("..");
function launch(handler) {
    return (0, __1.launch)(endpointForParentProcess(), handler);
}
exports.launch = launch;
function connect(child) {
    return (0, __1.connect)(endpointForChildProcess(child));
}
exports.connect = connect;
function endpointForParentProcess() {
    if (!process || !process.send) {
        throw new Error('`endpointForParentProcess` is only available in processes resulting from a fork() call');
    }
    return {
        onMessage: (callback) => process.addListener('message', callback),
        sendMessage: (message) => process.send(message),
        disconnect: () => {
            if (process.connected) {
                process.disconnect();
            }
        },
    };
}
exports.endpointForParentProcess = endpointForParentProcess;
function endpointForChildProcess(child) {
    return {
        onMessage: (callback) => child.addListener('message', callback),
        sendMessage: (message) => child.send(message),
        disconnect: () => {
            if (child.connected) {
                child.disconnect();
            }
        },
    };
}
exports.endpointForChildProcess = endpointForChildProcess;
