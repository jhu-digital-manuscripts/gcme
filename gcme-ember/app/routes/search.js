import Route from '@ember/routing/route';
import fetchJson from 'gcme-ember/utils/fetch-json';

export default class SearchRoute extends Route {
  async model() {
    const [restrictData, groupTitleMap] = await Promise.all([
      fetchJson('/text-powersel.json'),
      fetchJson('/group-title.json'),
    ]);
    return { restrictData, groupTitleMap };
  }
}
