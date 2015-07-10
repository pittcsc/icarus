import Ember from 'ember';
import DS from 'ember-data';

const { computed } = Ember;
const { Model, attr, hasMany } = DS;

export default Model.extend({

  /**
   * Authentication UUID for the user
   *
   * @property uuid
   */
  uid: attr('string'),

  /**
   * First Name
   *
   * @property firstName
   */
  firstName: attr('string'),

  /**
   * Last Name
   *
   * @property lastName
   */
  lastName: attr('string'),

  /**
   * Username
   *
   * @property username
   */
  userName: attr('string'),

  /**
   * Full name
   *
   * @property fullName
   */
  fullName: computed('firstName', 'lastName', function() {
    const firstName = this.get('firstName');
    const lastName = this.get('lastName');
    return `${firstName} ${lastName}`;
  }),

  votes: hasMany('votes', { async: true })

});
