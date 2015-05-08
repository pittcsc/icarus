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

  /**
   * Track user's voting status
   * @property voteValue
   * @type {Number}
   * @default 0
   */
  voteValue: 0,

  isUpvoted: Ember.computed('voteValue', {
    get: function() {
      return this.get('voteValue') === 1;
    }
  }),

  isDownvoted: Ember.computed('voteValue', {
    get: function() {
      return this.get('voteValue') === -1;
    }
  }),

  title: Ember.computed.alias('event.title'),
  score: Ember.computed.alias('event.totalvotes'),

  socket: Ember.inject.service(),

  actions: {
    /**
     * Cast a positive vote for an event
     */
    upvote() {
      const talk = this.get('event');
      this.get('socket').send({
        id: talk.id,
        type: 'upvote-talk'
      }).then(() => {
        this.set('voteValue', 1);
      });
    },

    /**
     * Cast a negative vote for an event
     */
    downvote() {
      const talk = this.get('event');
      this.get('socket').send({
        id: talk.id,
        type: 'downvote-talk'
      }).then(() => {
        this.set('voteValue', -1);
      });
    }
  }
});
