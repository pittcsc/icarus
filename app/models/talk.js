import Ember from 'ember';
import DS from 'ember-data';

const { RSVP, computed, inject } = Ember;
const { service } = inject;
const { Model, attr, hasMany } = DS;

export default Model.extend({

  /**
   * Reference to the session service, to get the current user
   */
  session: service(),

  /**
   * The title of the talk
   * @property title
   * @type {String}
   */
  title: attr('string'),

  body: attr('string'),

  votes: hasMany('votes', { async: true }),

  /**
   * Number of votes for this talk
   *
   * Required because, due to come weird behavior in Firebase, there seems to be
   * situations where the array of votes will have multiple instances of a vote,
   * even if the database only has one.  This property ensures that the votes in
   * the array are unique before getting the length.
   *
   * @property {Number} numVotes
   */
  numVotes: computed('votes', function() {
    return this.get('votes').uniq().length;
  }),

  isUpvoted: computed('votes.@each.user', 'session.currentUser', function() {
    const user = this.get('session.currentUser');
    return this.get('votes').mapBy('user.content').contains(user);
  }),

  /**
   * Toggles a vote from the current user
   *
   * Gets the current user and either creates or destroys the vote, based on
   * whether or not one already exists
   *
   * @method toggleVote
   * @return {RSVP.Promise}
   */
  toggleVote() {
    const user = this.get('session.currentUser');
    // Short-circuit if the user is not logged in
    if (!user) {
      return RSVP.reject('User is not logged in');
    }

    // Create/destroy the vote
    if (this.get('isUpvoted')) {
      return this.removeVote(user);
    } else {
      return this.addVote(user);
    }
  },

  /**
   * Add a vote
   *
   * @method addVote
   * @param {User} user
   * @return {RSVP.Promise}
   */
  addVote(user) {
    const vote = this.get('store').createRecord('vote', {
      talk: this,
      user
    });
    this.get('votes').addObject(vote);
    user.get('votes').addObject(vote);
    return RSVP.all([user.save(), vote.save(), this.save()]);
  },

  /**
   * Remove a vote
   *
   * @method removeVote
   * @param {User} user
   * @return {RSVP.Promise}
   */
  removeVote(user) {
    const [vote] = this.get('votes').filterBy('user.content', user);
    return vote.destroyRecord().then(() => this.save());
  }

});
