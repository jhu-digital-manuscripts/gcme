import Service from '@ember/service';
import $ from 'jquery';
import ENV from 'gcme-ember/config/environment';

export default Service.extend({
  search_uri: ENV.gcme.elasticsearch,

  executeQuery(query) {
    return $.ajax({
      url: this.search_uri,
      method: 'POST',
      data: JSON.stringify(query),
      headers: {'Content-Type': 'application/json; charset=utf-8'},
    });
  },

  // Return promise that resolves to array of matching source objects with the given term.
  // Each source object has a _match attribute added which contains the matching text.
  complete(term, prefix) {
    let query = {
      suggest: {
        term_suggest : {
          prefix : prefix,
            completion : {
              field: term + ".suggest",
              size: 10
            }
        }
      }
    };

    return this.executeQuery(query).then(result =>
      result.suggest.term_suggest[0].options.map(o => {
        o._source._match = o.text;
        return o._source;
    }));
  }
});
