import Ember from 'ember';

export default Ember.Service.extend({

  userObject: null,

  user: Ember.computed('userObject', function() {
    const obj = this.get('userObject');
    return Ember.Object.create({
      firstName: obj['first-name'],
      lastName: obj['last-name']
    });
  }),

  isAuthenticated: Ember.computed.bool('userObject')

});
