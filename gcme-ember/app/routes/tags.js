import Route from '@ember/routing/route';
import $ from 'jquery';

export default Route.extend({
  tagtable: $.ajax({url: '/tag-table.json'}),

  model() {
    return this.get('tagtable');
  }
});
