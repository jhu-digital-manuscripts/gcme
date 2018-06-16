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
  }
});
