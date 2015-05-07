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
   *  talk: the talk that this component represents
   *
   */

  title: Ember.computed.alias('talk.title'),

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
