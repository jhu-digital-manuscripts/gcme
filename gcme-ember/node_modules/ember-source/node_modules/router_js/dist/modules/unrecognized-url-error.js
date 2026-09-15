const UnrecognizedURLError = (function () {
    UnrecognizedURLError.prototype = Object.create(Error.prototype);
    UnrecognizedURLError.prototype.constructor = UnrecognizedURLError;
    function UnrecognizedURLError(message) {
        let error = Error.call(this, message);
        this.name = 'UnrecognizedURLError';
        this.message = message || 'UnrecognizedURL';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UnrecognizedURLError);
        }
        else {
            this.stack = error.stack;
        }
    }
    return UnrecognizedURLError;
})();
export default UnrecognizedURLError;
//# sourceMappingURL=unrecognized-url-error.js.map