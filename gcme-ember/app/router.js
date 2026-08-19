import EmberRouter from '@ember/routing/router';
import config from './config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function() {
  this.route('about');
  this.route('contact');
  this.route('search');
  this.route('tags');
  this.route('help');

  // Catch-all route for unknown URLs - must be last
  this.route('not-found', { path: '/*path' });
});
