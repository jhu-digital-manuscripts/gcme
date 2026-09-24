import Component from '@glimmer/component';
import { action } from '@ember/object';
import { htmlSafe } from '@ember/template';

/**
 * Popup describing one word of a text: its headword, its grammatical tag, the
 * dictionary definitions recorded for it, how many lines contain it, and a
 * button which searches for it.
 */
export default class WordPopupComponent extends Component {
  /** Absolute position inside the text container. */
  get style() {
    const top = Number(this.args.top) || 0;
    const left = Number(this.args.left) || 0;
    return htmlSafe(`top: ${top}px; left: ${left}px;`);
  }

  get hasOtherSenses() {
    return (this.args.info?.otherSenses?.length ?? 0) > 0;
  }

  @action
  close() {
    this.args.onClose?.();
  }

  @action
  search() {
    this.args.onSearch?.(this.args.info.word);
  }
}
