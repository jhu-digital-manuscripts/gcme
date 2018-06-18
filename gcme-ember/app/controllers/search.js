import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  elasticsearch: service(),
  result: null,
  restrict: null,
  lemmas: null,

  actions: {
    completeWord() {
      console.log("complete words");
    },

    completeLemma(prefix) {
      console.log("complete lemmas");


      console.log(prefix);


      return this.elasticsearch.complete('tag_lemma', prefix);
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
