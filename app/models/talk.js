import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({

  title: DS.attr('string'),
  upvotes: DS.attr('number'),
  downvotes: DS.attr('number'),

  /**
   * Total, combined vote count
   * @property totalVotes
   * @type {Number}
   */
  totalvotes: Ember.computed('upvotes', 'downvotes', {
    get: () => this.get('upvotes') - this.get('downvotes')
  }),

  setupSocketEvents: function() {
    this.socket.on('upvote-talk', this.get('id'), () => {
      const votes = this.get('upvotes');
      this.set('upvotes', votes + 1);
    });
  }.on('ready'),

  teardownSocketEvents: function() {
    this.socket.off('upcote-talk', this.get('id'));
  }.on('didDelete')
});
