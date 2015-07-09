import DS from 'ember-data';

const { Model, attr } = DS;

export default Model.extend({

  /**
   * The title of the talk
   * @property title
   * @type {String}
   */
  title: attr('string')

});
