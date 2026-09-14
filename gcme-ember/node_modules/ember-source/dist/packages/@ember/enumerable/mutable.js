import Enumerable from './index.js';
import Mixin from '../object/mixin.js';

/**
@module ember
*/

/**
  The methods in this mixin have been moved to MutableArray. This mixin has
  been intentionally preserved to avoid breaking MutableEnumerable.detect
  checks until the community migrates away from them.

  @class MutableEnumerable
  @namespace Ember
  @uses Enumerable
  @private
*/
// eslint-disable-next-line @typescript-eslint/no-empty-object-type

const MutableEnumerable = Mixin.create(Enumerable);

export { MutableEnumerable as default };
