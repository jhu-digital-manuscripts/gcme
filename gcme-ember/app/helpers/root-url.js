import { helper } from '@ember/component/helper';
import config from 'gcme-ember/config/environment';

/**
 * Returns the application's rootURL for use in templates.
 *
 * Usage: {{root-url}}
 * Example: <img src="{{root-url}}images/logo.png">
 */
export default helper(function rootUrl() {
  return config.rootURL;
});
