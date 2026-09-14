"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpointForParent = exports.endpointForWorker = exports.connect = exports.launch = void 0;
const __1 = require("..");
function launch(implementation) {
    return (0, __1.launch)(endpointForParent(), implementation);
}
exports.launch = launch;
function connect(worker) {
    return (0, __1.connect)(endpointForWorker(worker));
}
exports.connect = connect;
function endpointForWorker(worker) {
    return {
        onMessage: (callback) => worker.addEventListener('message', (event) => callback(event.data)),
        sendMessage: (message) => worker.postMessage(message),
        disconnect: () => worker.terminate(),
    };
}
exports.endpointForWorker = endpointForWorker;
function endpointForParent() {
    return {
        onMessage: (callback) => addEventListener('message', (event) => callback(event.data)),
        sendMessage: (message) => postMessage(message),
        disconnect: () => close(),
    };
}
exports.endpointForParent = endpointForParent;
