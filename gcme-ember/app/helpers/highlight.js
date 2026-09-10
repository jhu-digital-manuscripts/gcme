import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/template';

// Assume we have simple safe html
export function highlight(param) {
    return htmlSafe(param);
}

export default helper(highlight);
