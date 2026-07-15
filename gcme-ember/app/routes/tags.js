import Route from '@ember/routing/route';
import fetchJson from 'gcme-ember/utils/fetch-json';

export default class TagsRoute extends Route {
  async model() {
    try {
      const rows = await fetchJson('/tag-table.json');
      return { rows, loadError: null };
    } catch (err) {
      return {
        rows: [],
        loadError:
          err && err.message
            ? err.message
            : 'Could not load tag reference table.',
      };
    }
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.loadError = model.loadError;
  }
}
