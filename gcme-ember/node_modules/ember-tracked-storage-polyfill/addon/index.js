import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';

class TrackedStorageImpl {
  @tracked _value;
  _lastValue;

  constructor(initialValue, isEqual) {
    this._value = this._lastValue = initialValue;
    this._isEqual = isEqual;
  }
}

function tripleEq(a, b) {
  return a === b;
}

export function createStorage(initialValue, isEqual = tripleEq) {
  assert(
    'the second parameter to `createStorage` must be an equality function or undefined',
    typeof isEqual === 'function'
  );

  return new TrackedStorageImpl(initialValue, isEqual);
}

export function getValue(storage) {
  assert(
    'getValue must be passed a tracked store created with `createStorage`.',
    storage instanceof TrackedStorageImpl
  );

  return storage._value;
}

export function setValue(storage, value) {
  assert(
    'setValue must be passed a tracked store created with `createStorage`.',
    storage instanceof TrackedStorageImpl
  );

  const { _isEqual: isEqual, _lastValue: lastValue } = storage;

  if (!isEqual(value, lastValue)) {
    storage._value = storage._lastValue = value;
  }
}
