import Ember from 'ember';
import config from '../config/environment';
import Message from '../utils/message';

export default Ember.Service.extend({

  // Store the Socket.io connection
  connection: null,

  events: {},

  // Called from an initializer to ensure that the socket connection exists
  // before allowing the JS app to boot
  setup: function() {
    return new Ember.RSVP.Promise((resolve) => {
      var socket = new WebSocket(`ws://${config.apiURL}/socket/`);

      socket.onclose = function() {
        // Do something to unsubscribe from messages
      };

      socket.onmessage = (evt) => {
        const msg = new Message(evt.data);
        const cb = this.get('events')[msg.type][msg.id];
        if (cb !== null) {
          cb();
        }
      };

      this.set('connection', socket);

      resolve();

    });
  },

  on: function(type, id, cb) {
    const events = this.get('events');
    events[type][id] = cb;
  },

  off: function(type, id) {
    const events = this.get('events');
    events[type][id] = null;
  },

  send: function(data) {
    const connection = this.get('connection');
    const msg = new Message(data);
    connection.send(msg.toJSON());
  }

});
