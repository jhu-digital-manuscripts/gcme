import EmberBootstrapV5Theme from 'ember-models-table/services/emt-themes/ember-bootstrap-v5';

/**
 * Models-table theme for this app.
 *
 * The stock `emt-themes/ember-bootstrap-v5` theme names its icons with
 * Font Awesome 4 classes (`fa fa-fw fa-check-square-o`, `caret`, ...).
 * This app does not bundle Font Awesome, and those class names were also
 * removed in Font Awesome 5, so every one of those icons rendered as an
 * empty `<i>` element. The visible symptom was the Columns dropdown on the
 * search page listing column names with no checkbox next to them, so there
 * was no way to tell which columns were currently displayed.
 *
 * Rather than pull in an icon font for four glyphs, we point the theme at
 * our own class names and draw them with CSS in `app/styles/app.css`.
 */
export default class GcmeTableThemeService extends EmberBootstrapV5Theme {
  // Column visibility checkboxes in the Columns dropdown.
  columnVisibleIcon = 'gcme-emt-icon gcme-emt-icon-checked';

  columnHiddenIcon = 'gcme-emt-icon gcme-emt-icon-unchecked';

  // Caret on the Columns dropdown toggle button. Bootstrap 5 already draws a
  // caret on `.dropdown-toggle`, which ember-bootstrap puts on the button, so
  // this one is hidden in CSS rather than drawn: showing it too gives two carets.
  caretIcon = 'gcme-emt-icon gcme-emt-icon-caret';

  // Sort direction indicators in sortable column headers (tags table).
  sortAscIcon = 'gcme-emt-icon gcme-emt-icon-sort-asc';

  sortDescIcon = 'gcme-emt-icon gcme-emt-icon-sort-desc';
}
