import Ember from 'ember';

export default Ember.Controller.extend({

  actions: {
    upvote() {
      const event = this.get('model');
      event.upvote();
    }
  }
});
