import DS from 'ember-data';
import config from '../config/environment';

export default DS.RESTAdapter.extend({
  host: `http://${config.apiURL}`,
  namespace: 'api'
});

