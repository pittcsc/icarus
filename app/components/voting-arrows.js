import Ember from 'ember';

export default Ember.Component.extend({

  classNames: ['voting-arrows'],

  attributeBindings: ['lid:data-voting-id'],

  lid: null,

  actions: {

    upvoteEvent() {
      if (!this.get('isUpvoted')) {
        this.sendAction('upvoteAction');
      }
    },

    downvoteEvent() {
      if (!this.get('isDownvoted')) {
        this.sendAction('downvoteAction');
      }
    }
  }
});
