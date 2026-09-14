"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TransitionIntent = void 0;

class TransitionIntent {
  constructor(router, data = {}) {
    this.router = router;
    this.data = data;
  }

}

exports.TransitionIntent = TransitionIntent;