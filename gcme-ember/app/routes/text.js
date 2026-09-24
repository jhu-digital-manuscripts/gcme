import Route from '@ember/routing/route';
import { service } from '@ember/service';
import fetchJson from 'gcme-ember/utils/fetch-json';
import config from 'gcme-ember/config/environment';
import { buildTextBlocks } from 'gcme-ember/utils/text/sections';

export default class TextRoute extends Route {
  @service corpus;

  // The selected text and the line to scroll to are both in the URL, so a
  // reading position can be bookmarked and linked to from a search result.
  queryParams = {
    group: { refreshModel: true },
    line: { refreshModel: true },
  };

  /** @type {{ restrictData: unknown, groupTitleMap: unknown }|null} */
  _staticData = null;

  /** @type {{ group: string, text: Object }|null} */
  _textCache = null;

  async model({ group }) {
    if (!this._staticData) {
      const [restrictData, groupTitleMap] = await Promise.all([
        fetchJson(`${config.rootURL}text-powersel.json`),
        fetchJson(`${config.rootURL}group-title.json`),
      ]);
      this._staticData = { restrictData, groupTitleMap };
    }

    const { restrictData, groupTitleMap } = this._staticData;

    if (!group) {
      return { restrictData, groupTitleMap, group: '', text: null, loadError: null };
    }

    // Rebuilding a text is expensive for a whole author, so the last one is
    // reused when only the line to scroll to has changed.
    if (this._textCache?.group === group) {
      return {
        restrictData,
        groupTitleMap,
        group,
        text: this._textCache.text,
        loadError: null,
      };
    }

    try {
      await this.corpus.ensureReady();
    } catch (err) {
      return {
        restrictData,
        groupTitleMap,
        group,
        text: null,
        loadError: `The texts could not be loaded: ${err.message}`,
      };
    }

    const text = buildTextBlocks({
      lines: this.corpus.lines,
      indices: this.corpus.lineIndicesForGroup(group),
      groupId: group,
      titles: groupTitleMap,
    });
    this._textCache = { group, text };

    return { restrictData, groupTitleMap, group, text, loadError: null };
  }

  setupController(controller, model, transition) {
    super.setupController(controller, model, transition);
    if (model.text && controller.line) {
      controller.scrollAfterRender(controller.line);
    }
  }
}
