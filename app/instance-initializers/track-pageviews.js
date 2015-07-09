import Ember from 'ember';

const { on } = Ember;

export function initialize(instance) {
  const track = instance.registry.lookup('service:track');

  Ember.Router.reopen({
    trackPageview: on('didTransition', function() {
      track.track('Page View', {
        'Name': document.title,
        'URL': window.location.pathname
      });
    })
  });
}

export default {
  name: 'track-pageviews',
  initialize: initialize
};
