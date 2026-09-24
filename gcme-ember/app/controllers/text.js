import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import afterRender from '../utils/after-render';
import { flattenOptions } from '../utils/powersel';

/** Class marking the line a link pointed at. */
const TARGET_CLASS = 'gcme-text-line-target';

export default class TextController extends Controller {
  @service router;

  queryParams = ['group', 'line'];

  /** Group id of the text being read. */
  @tracked group = '';

  /** Printed number of the line to scroll to, or '' for the start. */
  @tracked line = '';

  get options() {
    return flattenOptions(this.model?.restrictData);
  }

  /** The dropdown option for the selected text, or null when none is chosen. */
  get selectedOption() {
    return this.group ? (this.options.get(this.group) ?? null) : null;
  }

  @action
  selectText(option) {
    this.router.transitionTo('text', {
      queryParams: { group: option?.id ?? '', line: '' },
    });
  }

  /**
   * Scroll to a line once the text has been rendered.
   *
   * @param {string} rawNumber A `raw_number` such as `252a`.
   */
  async scrollAfterRender(rawNumber) {
    await afterRender();
    this.scrollToLine(rawNumber);
  }

  /**
   * Scroll the line with the given printed number into view and mark it.
   *
   * The line elements are rendered from data that never changes, so marking
   * one directly does not fight with Glimmer over the DOM, and it avoids
   * making every line of the text depend on the current target.
   *
   * @param {string} rawNumber A `raw_number` such as `252a`.
   */
  @action
  scrollToLine(rawNumber) {
    if (!rawNumber) {
      return;
    }

    for (const marked of document.querySelectorAll(`.${TARGET_CLASS}`)) {
      marked.classList.remove(TARGET_CLASS);
    }

    const selector = `.gcme-text-line[data-raw="${CSS.escape(rawNumber)}"]`;
    const element = document.querySelector(selector);
    if (!element) {
      return;
    }

    element.classList.add(TARGET_CLASS);
    element.scrollIntoView({ block: 'center' });
  }
}
