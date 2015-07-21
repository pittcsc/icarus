import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';

moduleFor('adapter:application', 'ApplicationAdapter', {
  // Specify the other units that are required for this test.
  // needs: ['serializer:foo']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  const firebase = Ember.Object.create({
    ref() {
      return true;
    }
  });
  var adapter = this.subject({
    firebase
  });
  assert.ok(adapter);
});
