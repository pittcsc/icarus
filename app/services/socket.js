import Ember from 'ember';
import config from '../config/environment';

export default Ember.Service.extend({

  // Store the Socket.io connection
  connection: null,

  // Called from an initializer to ensure that the socket connection exists
  // before allowing the JS app to boot
  setup: function() {
    return new Ember.RSVP.Promise((resolve) => {
      var socket = io(config.apiURL);
      socket.on('connection', function() {
        resolve();
      });
    });
  }

});
