import Route from '@ember/routing/route';
import $ from 'jquery';
import RSVP from 'rsvp';

export default Route.extend({
  restrictData: $.ajax({url: '/text-powersel.json'}),
  groupTitleMap: $.ajax({url: '/group-title.json'}),

  model() {
    return RSVP.hash({
      restrictData: this.get('restrictData'),
      groupTitleMap: this.get('groupTitleMap')
    });
  }
});
