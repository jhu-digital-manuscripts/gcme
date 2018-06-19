import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  elasticsearch: service(),
  result: null,
  restrict: null,
  lemmas: null,
  words: null,
  requireAllWords: false,
  sortLogical: false,

  actions: {
    completeWord(prefix) {
      return this.elasticsearch.complete('word', prefix);
    },

    completeLemma(prefix) {
      return this.elasticsearch.complete('tag_lemma', prefix);
    },

    clearSearch() {
      this.set('lemmas', null);
      this.set('words', null);
      this.set('restrict', null);
    },

    executeSearch() {
      let clause = [];

      if (this.get('words')) {
        this.get('words').forEach(o => {
          clause.push({term: {text: o._match}});
        });
      }

      if (this.get('lemmas')) {
        this.get('lemmas').forEach(o => {
          clause.push({term: {tag_lemma_text: o._match}});
        });
      }

      if (clause.length == 0) {
        return;
      }

      let query = {
        query: {
          bool: {
            must: {
              bool: {

              }
            }
          }
        },
        highlight: {
          fields : {
            text: {},
            tag_lemma_text: {}
          }
        }
      };

      if (this.get('requireAllWords')) {
        query.query.bool.must.bool.must = clause;
      } else {
        query.query.bool.must.bool.should = clause;
      }

      if (this.get('restrict')) {
        query.query.bool.filter = {
          term: {
            group: this.get('restrict.id')
          }
        };
      }

      if (this.get('sortLogical')) {
        query.sort = [{ id : "asc"}, {number: "asc" }, {raw_number: "asc"}];
      }

      this.elasticsearch.executeQuery(query).then(result => this.set('result', result));
    },
  }
});
