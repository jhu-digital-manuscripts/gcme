import Route from '@ember/routing/route';
import fetchJson from 'gcme-ember/utils/fetch-json';
import config from 'gcme-ember/config/environment';

export default class SearchRoute extends Route {
  async model() {
    const [restrictData, groupTitleMap] = await Promise.all([
      fetchJson(`${config.rootURL}text-powersel.json`),
      fetchJson(`${config.rootURL}group-title.json`),
    ]);
    return { restrictData, groupTitleMap };
  }
}
