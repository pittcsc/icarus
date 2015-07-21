import Ember from 'ember';

const { RSVP, computed, inject, on, run } = Ember;
const { bool } = computed;
const { service } = inject;

export default Ember.Service.extend({

  store: service(),

  firebase: service(),

  currentUser: null,

  isAuthenticated: bool('currentUser'),

  onAuthentication: on('init', function() {
    this.get('firebase').onAuth((authData) => {
      if (!authData) {
        this.set('currentUser', null);
        return;
      }
      this._userWithUid(authData.uid)
      .then((user) => {
        // Set the user if we found one in the database
        this.set('currentUser', user);
      });
    });
  }),

  login() {
    this.get('firebase').authWithOAuthPopup('github', run.bind(this, this._onAuthCallback));
  },

  _onAuthCallback(error, user) {
    if (error) {
      this._onAuthFailure(error);
    } else {
      this._onAuthSuccess(user);
    }
  },

  _onAuthSuccess(authData) {
    this._userWithUid(authData.uid)
    .then((user) => {
      this.set('currentUser', user);
    })
    .catch(() => {
      // Couldn't find the user; need to make it
      const { github, uid } = authData;
      const [firstName, lastName] = github.displayName.split(' ');
      const userName = github.username;
      this.get('store').createRecord('user', {
        uid,
        firstName,
        lastName,
        userName
      }).save().then((user) => {
        this.set('currentUser', user);
      });
    });
  },

  _onAuthFailure(error) {
    console.error(error);
  },

  /**
   * Fetch a user by the UID returned as part of authentication
   *
   * @method _userWithUid
   * @param {String} uid
   * @returns {RSVP.Promise}
   */
  _userWithUid(uid) {
    return this.get('store').query('user', { orderBy: 'uid', equalTo: uid })
    .then((users) => {
      const user = users.get('firstObject');
      if (user) {
        return user;
      } else {
        return RSVP.reject();
      }
    });
  }

});
