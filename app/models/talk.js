import DS from 'ember-data';

export default DS.Model.extend({

  title: DS.attr('string'),
  upvotes: DS.attr('number'),
  downvotes: DS.attr('number'),

  totalvotes: function() {
    return this.get('upvotes') - this.get('downvotes');
  }.property('upvotes', 'downvotes'),

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
