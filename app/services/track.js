import Ember from 'ember';
import config from '../config/environment';

export default Ember.Service.extend({

  /**
   * Store events tracked before initialization is done
   */
  _store: [],

  /**
   * Is the service available?
   * Determiend based on the presense of the token
   */
  _available: Ember.computed({
    get: function() {
      return Ember.isPresent(config.MIXPANEL_TOKEN) && config.MIXPANEL_ENABLE;
    }
  }),

  /**
   * Is the service initialized?
   */
  _initialized: false,

  /**
   * If the service is available, initialize Mixpanel with the token
   * Gets token from an environment variable
   */
  init() {
    // If the mixpanel token is available, initialize mixpanel with it
    if (this.get('_available')) {
      // Initialize service
      window.mixpanel.init(config.MIXPANEL_TOKEN);
      this.set('_initialized', true);

      // Empty store of events to track
      Ember.RSVP.all(this.get('_store').map((item) => {
        const [event, data] = item;
        return this.track(event, data);
      })).then(() => {
        this.set('_store', []);
      });
    }
  },

  /**
   * Track an event if the library is available
   * @method track
   * @returns {RSVP.Promise}
   */
  track(event, data) {
    // If the tracker isn't available yet, store the request for later
    if (!this.get('_initialized')) {
      const store = this.get('_store');
      store.push([event, data]);
      return Ember.RSVP.resolve();
    }

    // If it is available, just sent the request now
    return new Ember.RSVP.Promise((resolve) => {
      window.mixpanel.track(event, data, function() {
        resolve();
      });
    });
  }

});
