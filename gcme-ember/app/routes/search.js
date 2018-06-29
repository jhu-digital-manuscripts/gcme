import Route from '@ember/routing/route';
import $ from 'jquery';
import RSVP from 'rsvp';

export default Route.extend({
  model() {
    return RSVP.hash({
      restrictData: $.ajax({url: '/text-powersel.json'}),
      groupTitleMap: $.ajax({url: '/group-title.json'})
    });
  }
});
