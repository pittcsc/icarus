import Ember from 'ember';
import config from '../config/environment';
import io from 'npm:socket.io-client';

export default Ember.Service.extend({

  // Store the Socket.io connection
  connection: null,

  init: function() {
    console.log('test');
    const socket = io(`${config.apiURL}/socket.io/`);
    socket.on('connect', () => {
      alert('connection established!');
      this.set('connection', socket);
    });
  }

});
