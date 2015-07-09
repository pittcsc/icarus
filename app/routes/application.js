import Ember from 'ember';

const { inject } = Ember;
const { service } = inject;

export default Ember.Route.extend({

  session: service(),

  actions: {
    login() {
      this.get('session').login();
    }
  }

});
