import Ember from 'ember';

export default Ember.Component.extend({

  classNames: ['voting-arrows'],

  attributeBindings: ['lid:data-voting-id'],

  lid: null,

  actions: {
    vote() {
      this.sendAction('toggleVote');
    }
  }
});
