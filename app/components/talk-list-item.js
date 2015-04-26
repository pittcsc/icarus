import Ember from 'ember';

export default Ember.Component.extend({

  talk: null,
  socket: Ember.inject.service(),

  actions: {
    upvote: function() {
      const talk = this.get('talk');
      this.get('socket').send({
        id: talk.id,
        type: 'upvote-talk'
      });
    }
  }
});
