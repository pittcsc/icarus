import Ember from 'ember';

export default Ember.Component.extend({

  // Class name for component
  classNames: ['event-list-item'],

  // Services
  session: Ember.inject.service(),

  // Stuff for liquid-fire
  attributeBindings: ['lid:data-container-id'],
  lid: Ember.computed.alias('event.id'),

  // Event for item, plus properties for event attributes
  event: null,
  title: Ember.computed.alias('event.title'),
  score: Ember.computed.alias('event.totalvotes'),

  actions: {

    // Cast a positive vote for an event
    upvote() {
      const event = this.get('event');
      event.upvote();
    },

    // Cast a negative vote for an event
    downvote() {
      const event = this.get('event');
      event.downvote();
    }
  }
});
