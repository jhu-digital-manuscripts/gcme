import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import afterRender from '../utils/after-render';

/** Width reserved for the popup when it is pushed back inside the text. */
const POPUP_WIDTH = 420;

/**
 * The body of a text: its sections, their lines, and the popup describing a
 * clicked word.
 *
 * Events are handled on the container rather than on each line, and the words
 * of a line are wrapped in buttons only once the reader's pointer or keyboard
 * focus reaches that line. A whole author is tens of thousands of lines and
 * hundreds of thousands of words, so neither per-line listeners nor eager
 * per-word elements are affordable.
 */
export default class TextBodyComponent extends Component {
  @service corpus;
  @service router;

  /** @type {{ info: Object, top: number, left: number }|null} */
  @tracked popup = null;

  /** @type {HTMLElement|null} The word the popup describes. */
  _anchor = null;

  _onDocumentClick = (event) => {
    if (!this.popup) {
      return;
    }
    const target = event.target;
    if (target.closest?.('.gcme-word-popup') || target.closest?.('.gcme-word')) {
      return;
    }
    this.closePopup();
  };

  constructor() {
    super(...arguments);
    document.addEventListener('click', this._onDocumentClick, true);
  }

  willDestroy() {
    super.willDestroy(...arguments);
    document.removeEventListener('click', this._onDocumentClick, true);
  }

  /** Wrap the words of a line in buttons when the reader reaches it. */
  @action
  hydrateLine(event) {
    const row = this.rowFor(event.target);
    if (row && !row.hydrated) {
      row.hydrated = true;
    }
  }

  @action
  async handleClick(event) {
    const wordElement = event.target.closest?.('.gcme-word');
    if (!wordElement) {
      return;
    }

    const row = this.rowFor(wordElement);
    const tokenIndex = Number.parseInt(wordElement.dataset.token, 10);
    if (!row || Number.isNaN(tokenIndex)) {
      return;
    }

    const info = this.corpus.wordInfo({
      lineIndex: row.lineIndex,
      tokenIndex,
      groupId: this.args.groupId,
    });
    if (!info) {
      return;
    }

    this._anchor = wordElement;
    this.popup = { info, ...this.positionFor(wordElement) };

    // Move focus into the popup so it can be read and dismissed by keyboard.
    await afterRender();
    document.querySelector('.gcme-word-popup')?.focus();
  }

  @action
  handleKeydown(event) {
    if (event.key === 'Escape' && this.popup) {
      this.closePopup();
    }
  }

  @action
  closePopup() {
    if (!this.popup) {
      return;
    }
    this.popup = null;
    const anchor = this._anchor;
    this._anchor = null;
    anchor?.focus?.();
  }

  /** Search for the word the popup describes, leaving the reading view. */
  @action
  searchWord(word) {
    this.popup = null;
    this._anchor = null;
    this.router.transitionTo('search', {
      queryParams: {
        words: word,
        lemmas: '',
        tags: '',
        restrict: '',
        all: false,
        sort: false,
        page: 1,
      },
    });
  }

  /**
   * The row an event happened in.
   *
   * @param {EventTarget} target
   * @returns {import('../utils/text/sections').TextRow|null}
   */
  rowFor(target) {
    const lineElement = target?.closest?.('.gcme-text-line');
    if (!lineElement) {
      return null;
    }
    const lineIndex = Number.parseInt(lineElement.dataset.line, 10);
    if (Number.isNaN(lineIndex)) {
      return null;
    }
    return this.args.text?.rowsByIndex?.get(lineIndex) ?? null;
  }

  /**
   * Where to put the popup: under the word, inside the text container.
   *
   * @param {HTMLElement} wordElement
   * @returns {{ top: number, left: number }} Offsets within the container.
   */
  positionFor(wordElement) {
    const container = wordElement.closest('.gcme-text');
    if (!container) {
      return { top: 0, left: 0 };
    }
    const word = wordElement.getBoundingClientRect();
    const box = container.getBoundingClientRect();
    const left = Math.max(
      0,
      Math.min(word.left - box.left, Math.max(0, box.width - POPUP_WIDTH)),
    );
    return { top: word.bottom - box.top + 6, left };
  }
}
