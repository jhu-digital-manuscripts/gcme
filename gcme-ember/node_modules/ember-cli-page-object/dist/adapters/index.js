import Adapter from '../adapter.js';
import RFC268Adapter from './rfc268.js';
import '@ember/test-helpers';

let _adapter;

/*
 * @private
 */
function getAdapter() {
  if (!_adapter) {
    return new RFC268Adapter();
  }
  return _adapter;
}
function setAdapter(adapter) {
  if (adapter === null) {
    _adapter = null;
    return;
  }
  if (false === adapter instanceof Adapter) {
    throw new Error('Invalid adapter type');
  }
  _adapter = adapter;
}

export { getAdapter, setAdapter };
