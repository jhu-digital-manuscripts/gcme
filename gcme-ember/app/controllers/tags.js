import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class TagsController extends Controller {
  @service('emt-themes/ember-bootstrap-v5') themeInstance;

  @tracked loadError = null;

  get columns() {
    return [
      { title: 'Tag', propertyName: 'tag' },
      { title: 'Description', propertyName: 'description' },
    ];
  }

  get groupProperties() {
    return [{ label: 'Type', value: 'group' }];
  }
}
