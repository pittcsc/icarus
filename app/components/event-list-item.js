import Ember from 'ember';

export default Ember.Component.extend({

  event: null,

  classNames: ['event-list-item'],

  title: Ember.computed.alias('event.title'),
  score: Ember.computed.alias('event.totalvotes'),

  socket: Ember.inject.service(),

  actions: {
    /**
     * Cast a positive vote for an event
     */
    upvote() {
      const event = this.get('event');
      event.upvote();
    },

    /**
     * Cast a negative vote for an event
     */
    downvote() {
      const event = this.get('event');
      event.downvote();
    }
  }
});
