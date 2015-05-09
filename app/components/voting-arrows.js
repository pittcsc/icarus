import Ember from 'ember';

export default Ember.Component.extend({

  classNames: ['voting-arrows'],

  attributeBindings: ['lid:data-voting-id'],

  lid: null,

  actions: {

    upvoteEvent() {
      this.sendAction('upvoteAction');
    },

    downvoteEvent() {
      this.sendAction('downvoteAction');
    }
  }
});
