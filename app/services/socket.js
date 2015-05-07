import Ember from 'ember';
import config from '../config/environment';
import Message from '../utils/message';

export default Ember.Service.extend({

  // Store the Socket.io connection
  connection: null,

  // Does the browser support websockets?
  available: function() {
    return "WebSocket" in window;
  }.property(),

  // Store table of events and IDs
  events: {},

  // Called from an initializer to ensure that the socket connection exists
  // before allowing the JS app to boot
  setup: function() {
    if (!this.get('available')) { return; }
    return new Ember.RSVP.Promise((resolve) => {
      var socket = new WebSocket(`ws://${config.apiURL}/socket/`);

      socket.onclose = function() {
        // Do something to unsubscribe from messages
      };

      socket.onmessage = (evt) => {
        const msg = new Message(evt.data);
        var cb;
        // Make sure the callback exists
        try {
          cb = this.get('events')[msg.type][msg.id];
        } catch (e) {
          return;
        }
        cb = cb || function() { };
        cb();
      };

      this.set('connection', socket);
      // TODO: resolve once the connection has been verified
      // TODO: handle WebSocket not being available
      resolve();

    });
  },

  on: function(type, id, cb) {
    if (!this.get('available')) { return; }
    const events = this.get('events');
    events[type] = events[type] || {};
    events[type][id] = cb;
  },

  off: function(type, id) {
    if (!this.get('available')) { return; }
    const events = this.get('events');
    events[type][id] = null;
  },

  send: function(data) {
    if (!this.get('available')) { return; }
    const connection = this.get('connection');
    const msg = new Message(data);
    connection.send(msg.toJSON());
    return Ember.RSVP.resolve();
  }

});
