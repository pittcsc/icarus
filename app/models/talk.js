import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({

  /**
   * Injection of the socket service
   * Allows the talk to subscribe to events about itself
   */
  socket: Ember.inject.service(),


  /**
   * The title of the talk
   * @property title
   * @type {String}
   */
  title: DS.attr('string'),


  /**
   * The number of upvotes the talk has
   * @property upvotes
   * @type {Number}
   */
  upvotes: DS.attr('number'),


  /**
   * The number of downvotes the talk has
   * @property downvotes
   * @type {Number}
   */
  downvotes: DS.attr('number'),


  /**
   * Track user's voting status
   * @property voteValue
   * @type {Number}
   * @default 0
   */
  voteValue: 0,


  /**
   * Is the talk upvoted by the current user?
   * @property isUpvoted
   * @type {Boolean}
   */
  isUpvoted: Ember.computed('voteValue', {
    get: function() {
      return this.get('voteValue') === 1;
    }
  }),


  /**
   * Is the talk downvoted by the current user?
   * @property isDownvoted
   * @type {Boolean}
   */
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


  /**
   * Subscribe to socket events
   * When the object is created, subscribe to the relevant socket events
   */
  setupSocketEvents: function() {
    this.socket.on('upvote-talk', this.get('id'), () => {
      const votes = this.get('upvotes');
      this.set('upvotes', votes + 1);
    });
  }.on('ready'),


  /**
   * Unsubscribe from socket events
   * If the object is, for some reason, deleted, unsubscribe from the relevant socket events
   */
  teardownSocketEvents: function() {
    this.socket.off('upcote-talk', this.get('id'));
  }.on('didDelete'),


  /**
   * Upvote the talk
   * @method upvote
   */
  upvote() {
    this.get('socket').send({
      id: this.get('id'),
      type: 'upvote-talk'
    }).then(() => {
      this.set('voteValue', 1);
    });
  },


  /**
   * Downvote the talk
   * @method downvote
   */
  downvote() {
    this.get('socket').send({
      id: this.get('id'),
      type: 'downvote-talk'
    }).then(() => {
      this.set('voteValue', -1);
    });
  }
});
