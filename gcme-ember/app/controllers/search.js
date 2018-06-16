import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  elasticsearch: service(),
  result: null,

  actions: {
    completeWords() {
      console.log("complete words");
    },

    completeLemmas() {
      console.log("complete lemmas");
    },

    executeSearch() {
      console.log("execute search");

      console.log(this.get('words'));
      console.log(this.get('lemmas'));

      let query = {
        query: {
          simple_query_string: {
            query: this.get('words'),
            fields: ["text"],
            default_operator: "and"
          }
        }
      };

      this.elasticsearch.executeQuery(query).then(result => this.set('result', result));
    },
  }
});
