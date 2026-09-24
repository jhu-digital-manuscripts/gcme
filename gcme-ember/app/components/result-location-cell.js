import Component from '@glimmer/component';

/**
 * Location cell of the search results: the author and the most specific text
 * containing the line, with the text linking into the reading view at that
 * line.
 */
export default class ResultLocationCellComponent extends Component {
  /** Group path of the line, from the top level down. */
  get groups() {
    return this.args.record?._source?.group ?? [];
  }

  /** Title of the top-level group, usually the author. */
  get topTitle() {
    return this.titleFor(this.groups[0]);
  }

  /** Most specific group containing the line. */
  get leafGroup() {
    return this.groups[this.groups.length - 1];
  }

  get leafTitle() {
    return this.titleFor(this.leafGroup);
  }

  get rawNumber() {
    return this.args.record?._source?.raw_number ?? '';
  }

  titleFor(id) {
    if (id == null) {
      return '';
    }
    return this.args.column?.groupTitleMap?.[id] ?? id;
  }
}
