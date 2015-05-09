import Ember from 'ember';

export default Ember.Component.extend({

  /**
   * ==== Attributes ====
   * Attributes are values that are passed into the compontent through the
   * template.  You access them using the `attrs` prefix, like so:
   *
   *    # JS
   *    this.get('attrs.name')
   *
   *    # HBS
   *    {{attrs.name}}
   *
   * Below is a listing of available attributes on this component
   *
   *  event: the talk that this component represents
   *
   */

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
