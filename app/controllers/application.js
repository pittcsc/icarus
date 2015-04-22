import Ember from 'ember';

export default Ember.Controller.extend({

  socket: Ember.inject.service('socket'),

  actions: {
    connect: function() {
      var socket = this.get('socket');
      console.debug(socket);
    }
  }

});
