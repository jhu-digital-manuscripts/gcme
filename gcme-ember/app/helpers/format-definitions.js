import { helper } from '@ember/component/helper';

export function formatDefinitions(params) {
  let [defs] = params;
  
  return defs.join(';  ');
}

export default helper(formatDefinitions);
