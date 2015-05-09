import Ember from 'ember';
import config from '../config/environment';

export default Ember.Route.extend({

  actions: {
    login() {
      const clientId = config.GITHUB_CLIENT_ID;
      const scope = 'user:email';
      window.location = `https://github.com/login/oauth/authorize?scope=${scope}&client_id=${clientId}`;
    }
  }
});
