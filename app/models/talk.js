import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({

  socket: Ember.inject.service(),

  title: DS.attr('string'),
  upvotes: DS.attr('number'),
  downvotes: DS.attr('number'),

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

  /**
   * Total, combined vote count
   * @property totalVotes
   * @type {Number}
   */
  totalvotes: Ember.computed('upvotes', 'downvotes', {
    get: function() {
     return this.get('upvotes') - this.get('downvotes');
    }
  }),

  setupSocketEvents: function() {
    this.socket.on('upvote-talk', this.get('id'), () => {
      const votes = this.get('upvotes');
      this.set('upvotes', votes + 1);
    });
  }.on('ready'),

  teardownSocketEvents: function() {
    this.socket.off('upcote-talk', this.get('id'));
  }.on('didDelete'),

  upvote() {
    this.get('socket').send({
      id: this.get('id'),
      type: 'upvote-talk'
    }).then(() => {
      this.set('voteValue', 1);
    });
  },

  downvote() {
    this.get('socket').send({
      id: this.get('id'),
      type: 'downvote-talk'
    }).then(() => {
      this.set('voteValue', -1);
    });
  }
});
