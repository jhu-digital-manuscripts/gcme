import { tracked } from '@glimmer/tracking';
import { tokenize } from '../corpus/word-info';

/** Lines per rendered chunk. Chunks let the browser skip off-screen work. */
export const CHUNK_SIZE = 50;

/** Only every fifth line of a section is numbered. */
export const NUMBER_INTERVAL = 5;

/**
 * One line of a text as the reading view renders it.
 *
 * A whole-author selection is tens of thousands of lines, so the words of a
 * line are wrapped in elements only once the reader touches that line. Each
 * row tracks its own hydration, which keeps re-rendering to the single line
 * that changed.
 */
export class TextRow {
  /** @type {boolean} True once the words of the line are rendered separately. */
  @tracked hydrated = false;

  /** @type {string[]|null} */
  _words = null;

  /**
   * @param {Object} options
   * @param {number} options.lineIndex Index of the line in the corpus.
   * @param {string} options.text The line as printed.
   * @param {string} options.rawNumber The line number as printed.
   * @param {string} options.label The number shown in the margin, or ''.
   */
  constructor({ lineIndex, text, rawNumber, label }) {
    this.lineIndex = lineIndex;
    this.text = text;
    this.rawNumber = rawNumber;
    this.label = label;
  }

  /** The words of the line, in order. */
  get words() {
    if (!this._words) {
      this._words = tokenize(this.text);
    }
    return this._words;
  }
}

/**
 * Build the renderable structure of a text.
 *
 * The lines of the selected group are taken in corpus order, which is the
 * order of `line.json` itself. They are cut into sections wherever the group
 * path changes, so selecting an intermediate group such as `CT` reads as a
 * sequence of titled texts, and each section is cut into fixed-size chunks.
 *
 * @param {Object} options
 * @param {Array<Object>} options.lines Every line of the corpus.
 * @param {number[]} options.indices Indices of the lines of this text.
 * @param {string} options.groupId The selected group id.
 * @param {Object} [options.titles] Map from group id to title.
 * @returns {{ title: string, lineCount: number, blocks: Array, rowsByIndex: Map<number, TextRow> }}
 */
export function buildTextBlocks({ lines, indices, groupId, titles }) {
  const blocks = [];
  const rowsByIndex = new Map();

  let currentPath = null;
  let previousPath = [];
  let block = null;
  let seenNumbers = null;

  for (const lineIndex of indices) {
    const line = lines[lineIndex];
    const path = line.group ?? [];

    if (currentPath === null || !samePath(path, currentPath)) {
      block = {
        key: `${blocks.length}`,
        headings: headingsFor(path, previousPath, groupId, titles),
        chunks: [],
      };
      blocks.push(block);
      previousPath = path;
      currentPath = path;
      seenNumbers = new Set();
    }

    const isSectionStart = block.chunks.length === 0;
    const row = new TextRow({
      lineIndex,
      text: line.text ?? '',
      rawNumber: line.raw_number ?? '',
      label: numberLabel(line, seenNumbers, isSectionStart),
    });

    let chunk = block.chunks[block.chunks.length - 1];
    if (!chunk || chunk.rows.length >= CHUNK_SIZE) {
      chunk = { key: `${block.key}-${block.chunks.length}`, rows: [] };
      block.chunks.push(chunk);
    }
    chunk.rows.push(row);
    rowsByIndex.set(lineIndex, row);
  }

  return {
    title: titles?.[groupId] ?? groupId,
    lineCount: indices.length,
    blocks,
    rowsByIndex,
  };
}

/**
 * The margin label for a line: every fifth numbered line, the first line of a
 * section, and any line numbered with something other than a number (the
 * rubrics of the Astrolabe, for instance). Lines which share a number with an
 * earlier line, such as `252a` after `252`, are left unlabelled.
 *
 * @param {Object} line A line document.
 * @param {Set<number>} seenNumbers Numbers already used in this section.
 * @param {boolean} isSectionStart True for the first line of a section.
 * @returns {string} The label, or '' when the line is not numbered.
 */
export function numberLabel(line, seenNumbers, isSectionStart) {
  const raw = line.raw_number ?? '';
  const number = line.number;
  const firstOfNumber = !seenNumbers.has(number);
  seenNumbers.add(number);

  if (isSectionStart) {
    return raw;
  }
  if (raw !== '' && !/^\d/.test(raw)) {
    return raw;
  }
  if (
    typeof number === 'number' &&
    number > 0 &&
    number % NUMBER_INTERVAL === 0 &&
    firstOfNumber
  ) {
    return raw;
  }
  return '';
}

/**
 * Headings introducing a section: the titles of the group path below the
 * selected group, minus the leading ones the previous section already
 * introduced. The heading level is the depth below the selected group.
 *
 * @param {string[]} path The group path of the section.
 * @param {string[]} previousPath The group path of the previous section.
 * @param {string} groupId The selected group id.
 * @param {Object} [titles] Map from group id to title.
 * @returns {Array<{ level: number, title: string }>}
 */
function headingsFor(path, previousPath, groupId, titles) {
  const start = path.indexOf(groupId);
  if (start === -1) {
    return [];
  }

  const headings = [];
  let changed = false;

  for (let i = start + 1; i < path.length; i++) {
    if (!changed && previousPath[i] === path[i]) {
      continue;
    }
    // Once one level of the path has changed, everything below it is new.
    changed = true;
    headings.push({
      level: Math.min(3, i - start),
      title: titles?.[path[i]] ?? path[i],
    });
  }

  return headings;
}

/**
 * @param {string[]} a
 * @param {string[]} b
 * @returns {boolean} True when both group paths are identical.
 */
function samePath(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
