export function initialize(container, application) {
  application.deferReadiness();
  const socket = container.lookup('service:socket');
  socket.setup().then(function() {
    application.advanceReadiness();
    application.inject('model', 'socket', 'service:socket');
  });
}

export default {
  name: 'socket-connection',
  initialize: initialize
};
