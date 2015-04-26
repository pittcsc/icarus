import DS from 'ember-data';

export default DS.Model.extend({

  title: DS.attr('string'),

  setupSocketEvents: function() {
    this.socket.on('upvote-talk', this.get('id'), () => {
      console.debug(this);
    });
  }.on('ready'),

  teardownSocketEvents: function() {
    this.socket.off('upcote-talk', this.get('id'));
  }.on('didDelete')
});
