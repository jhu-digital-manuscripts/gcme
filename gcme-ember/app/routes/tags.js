import Route from '@ember/routing/route';
import { action } from '@ember/object';
import fetchJson from 'gcme-ember/utils/fetch-json';

export default class TagsRoute extends Route {
  async model() {
    const rows = await fetchJson('/tag-table.json');
    return { rows };
  }

  @action
  error(err) {
    const controller = this.controllerFor('tags');
    controller.loadError =
      err && err.message
        ? err.message
        : 'Could not load tag reference table.';
    return false;
  }
}
