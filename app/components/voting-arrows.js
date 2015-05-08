import Ember from 'ember';

export default Ember.Component.extend({

  classNames: ['voting-arrows'],

  actions: {

    upvoteEvent() {
      this.sendAction('upvoteAction');
    },

    downvoteEvent() {
      this.sendAction('downvoteAction');
    }
  }
});
