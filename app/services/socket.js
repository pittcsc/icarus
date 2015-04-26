import Ember from 'ember';
import config from '../config/environment';

class Message {
  constructor(options) {
    options = JSON.parse(options);
    this.id = options.id;
    this.type = options.type;
    this.body = options.body;
  }

  toJSON() {
    const json = {
      id: this.id,
      type: this.type,
      body: this.body
    };
    return JSON.stringify(json);
  }
}

export default Ember.Service.extend({

  // Store the Socket.io connection
  connection: null,

  events: {},

  // Called from an initializer to ensure that the socket connection exists
  // before allowing the JS app to boot
  setup: function() {
    return new Ember.RSVP.Promise((resolve) => {
      var socket = new Websocket(`ws://${config.apiURL}/socket/`);
      socket.on('connection', function() {
        resolve();
      });

    });
  },

  on: function(type, id, cb) {
    const events = this.get('events');
    events[type][id] = cb;
  },

  off: function(type, id) {
    const events = this.get('events');
    events[type][id] = null;
  }

});
