import ajax from 'ic-ajax';
import config from '../config/environment';

export function initialize(container, application) {
  // Pause application boot
  application.deferReadiness();

  ajax({
    url: `http://${config.apiURL}/api/session`
  }).then(function(data) {
    container.lookup('service:session').set('userObject', data);
  }).finally(function() {
    application.advanceReadiness();
  });
}

export default {
  name: 'session',
  initialize: initialize,
  after: 'ajax-setup'
};
