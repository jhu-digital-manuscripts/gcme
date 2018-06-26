import Controller from '@ember/controller';
import Bootstrap4Theme from 'ember-models-table/themes/bootstrap4';

export default Controller.extend({
  theme: Bootstrap4Theme.create(),

  init() {
    this._super(...arguments);

    this.set('columns', [
      {
        title: 'Tag',
        propertyName: 'tag',
      },
      {
        title: 'Description',
        propertyName: 'description'
      }
    ]);

    this.set('groupProperties', [
      {label: 'Type', value: 'group'}
    ]);
  },
});
