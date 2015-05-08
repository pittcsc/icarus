import Ember from 'ember';

export function initialize(container) {
  const track = container.lookup('service:track');

  Ember.Router.reopen({
    trackPageview: function() {
      track.track('Page View', {
        'Name': document.title,
        'URL': window.location.pathname
      });
    }.on('didTransition')
  });
}

export default {
  name: 'track-pageviews',
  initialize: initialize
};
