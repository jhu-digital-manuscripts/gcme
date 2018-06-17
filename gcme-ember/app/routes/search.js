import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import $ from 'jquery';

export default Route.extend({

  model() {
    return RSVP.hash({
      texts:  $.ajax({url: "/text-powersel.json"})
    });
  }

});
