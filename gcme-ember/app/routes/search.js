import Route from '@ember/routing/route';
import fetchJson from 'gcme-ember/utils/fetch-json';
import config from 'gcme-ember/config/environment';

export default class SearchRoute extends Route {
  // Every search parameter refreshes the model, so one code path serves a
  // freshly composed search, a bookmarked URL, a reload, and the back button.
  queryParams = {
    words: { refreshModel: true },
    lemmas: { refreshModel: true },
    tags: { refreshModel: true },
    restrict: { refreshModel: true },
    all: { refreshModel: true },
    sort: { refreshModel: true },
    page: { refreshModel: true },
    size: { refreshModel: true },
  };

  /** @type {{ restrictData: unknown, groupTitleMap: unknown }|null} */
  _staticData = null;

  async model() {
    // The static files describe the corpus, not the search, so they are
    // fetched once even though the model is refreshed on every search.
    if (!this._staticData) {
      const [restrictData, groupTitleMap] = await Promise.all([
        fetchJson(`${config.rootURL}text-powersel.json`),
        fetchJson(`${config.rootURL}group-title.json`),
      ]);
      this._staticData = { restrictData, groupTitleMap };
    }
    // A fresh object every time: Ember skips setting the route up again when
    // the resolved model is the same object, and setting it up is what runs
    // the search for the parameters now in the URL.
    return { ...this._staticData };
  }

  setupController(controller, model, transition) {
    super.setupController(controller, model, transition);
    controller.syncDraftsFromQueryParams();
    controller.runQuery();
  }
}
