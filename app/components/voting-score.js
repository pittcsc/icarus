import Ember from 'ember';

export default Ember.Component.extend({

  /**
   * Give the voting arrows a unique ID that corresponds to the event being represented
   * Used for liquid-fire transitions
   */
  attributeBindings: ['lid:data-score-id'],

  lid: null,

  /**
   * Class names
   */
  classNames: ['score']

});
