import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  elasticsearch: service(),
  result: null,
  restrict: null,
  lemmas: null,
  matchingLemmas: null,

  actions: {
    completeWord() {
      console.log("complete words");
    },

    completeLemma(powerSelect) {
      console.log("complete lemmas");

      let prefix = powerSelect.lastSearchedText;

      console.log(prefix);

      this.set('matchingLemmas',
        this.elasticsearch.complete('tag_lemma', prefix).then(result => result.map(m => m.tag_lemma)));

    },

    executeSearch() {
      console.log("execute search");

      console.log(this.get('words'));
      console.log(this.get('lemmas'));

      let query = {
        query: {
          bool: {
            must: {
              simple_query_string: {
                query: this.get('words'),
                fields: ["text"],
                default_operator: "and"
              }
            }
          }
        }
      };

      if (this.restrict) {
        query.query.bool.filter = {
          term: {
            group: this.restrict.id
          }
        };
      }

      this.elasticsearch.executeQuery(query).then(result => this.set('result', result));
    },
  }
});
