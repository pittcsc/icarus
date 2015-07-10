/* jshint ignore:start */

/* jshint ignore:end */

define('icarus/adapters/application', ['exports', 'icarus/config/environment', 'firebase', 'emberfire/adapters/firebase'], function (exports, config, Firebase, FirebaseAdapter) {

  'use strict';

  exports['default'] = FirebaseAdapter['default'].extend({
    firebase: new Firebase['default'](config['default'].firebase)
  });

});
define('icarus/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'icarus/config/environment'], function (exports, Ember, Resolver, loadInitializers, config) {

  'use strict';

  var App;

  Ember['default'].MODEL_FACTORY_INJECTIONS = true;

  App = Ember['default'].Application.extend({
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix,
    Resolver: Resolver['default']
  });

  loadInitializers['default'](App, config['default'].modulePrefix);

  exports['default'] = App;

});
define('icarus/components/event-list-item', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({

    // Class name for component
    classNames: ['event-list-item'],

    // Services
    session: Ember['default'].inject.service(),

    // Stuff for liquid-fire
    attributeBindings: ['lid:data-container-id'],
    lid: Ember['default'].computed.alias('event.id'),

    // Event for item, plus properties for event attributes
    event: null,
    title: Ember['default'].computed.alias('event.title'),
    score: Ember['default'].computed.alias('event.numVotes'),

    actions: {
      upvote: function upvote() {
        var event = this.get('event');
        event.toggleVote();
      }
    }
  });

});
define('icarus/components/lf-outlet', ['exports', 'liquid-fire/ember-internals'], function (exports, ember_internals) {

	'use strict';

	exports['default'] = ember_internals.StaticOutlet;

});
define('icarus/components/lf-overlay', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var COUNTER = '__lf-modal-open-counter';

  exports['default'] = Ember['default'].Component.extend({
    tagName: 'span',
    classNames: ['lf-overlay'],

    didInsertElement: function didInsertElement() {
      var body = Ember['default'].$('body');
      var counter = body.data(COUNTER) || 0;
      body.addClass('lf-modal-open');
      body.data(COUNTER, counter + 1);
    },

    willDestroy: function willDestroy() {
      var body = Ember['default'].$('body');
      var counter = body.data(COUNTER) || 0;
      body.data(COUNTER, counter - 1);
      if (counter < 2) {
        body.removeClass('lf-modal-open');
      }
    }
  });

});
define('icarus/components/liquid-bind', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    tagName: '',
    positionalParams: ['value']
  });

});
define('icarus/components/liquid-child', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    classNames: ['liquid-child'],

    didInsertElement: function didInsertElement() {
      var $container = this.$();
      if ($container) {
        $container.css('visibility', 'hidden');
      }
      this.sendAction('didRender', this);
    }

  });

});
define('icarus/components/liquid-container', ['exports', 'ember', 'liquid-fire/growable', 'icarus/components/liquid-measured'], function (exports, Ember, Growable, liquid_measured) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend(Growable['default'], {
    classNames: ["liquid-container"],

    lockSize: function lockSize(elt, want) {
      elt.outerWidth(want.width);
      elt.outerHeight(want.height);
    },

    unlockSize: function unlockSize() {
      var _this = this;

      var doUnlock = function doUnlock() {
        _this.updateAnimatingClass(false);
        var elt = _this.$();
        if (elt) {
          elt.css({ width: "", height: "" });
        }
      };
      if (this._scaling) {
        this._scaling.then(doUnlock);
      } else {
        doUnlock();
      }
    },

    // We're doing this manually instead of via classNameBindings
    // because it depends on upward-data-flow, which generates warnings
    // under Glimmer.
    updateAnimatingClass: function updateAnimatingClass(on) {
      if (this.isDestroyed || !this._wasInserted) {
        return;
      }
      if (arguments.length === 0) {
        on = this.get("liquidAnimating");
      } else {
        this.set("liquidAnimating", on);
      }
      if (on) {
        this.$().addClass("liquid-animating");
      } else {
        this.$().removeClass("liquid-animating");
      }
    },

    startMonitoringSize: Ember['default'].on("didInsertElement", function () {
      this._wasInserted = true;
      this.updateAnimatingClass();
    }),

    actions: {

      willTransition: function willTransition(versions) {
        if (!this._wasInserted) {
          return;
        }

        // Remember our own size before anything changes
        var elt = this.$();
        this._cachedSize = liquid_measured.measure(elt);

        // And make any children absolutely positioned with fixed sizes.
        for (var i = 0; i < versions.length; i++) {
          goAbsolute(versions[i]);
        }

        // Apply '.liquid-animating' to liquid-container allowing
        // any customizable CSS control while an animating is occuring
        this.updateAnimatingClass(true);
      },

      afterChildInsertion: function afterChildInsertion(versions) {
        var elt = this.$();

        // Measure  children
        var sizes = [];
        for (var i = 0; i < versions.length; i++) {
          if (versions[i].view) {
            sizes[i] = liquid_measured.measure(versions[i].view.$());
          }
        }

        // Measure ourself again to see how big the new children make
        // us.
        var want = liquid_measured.measure(elt);
        var have = this._cachedSize || want;

        // Make ourself absolute
        this.lockSize(elt, have);

        // Make the children absolute and fixed size.
        for (i = 0; i < versions.length; i++) {
          goAbsolute(versions[i], sizes[i]);
        }

        // Kick off our growth animation
        this._scaling = this.animateGrowth(elt, have, want);
      },

      afterTransition: function afterTransition(versions) {
        for (var i = 0; i < versions.length; i++) {
          goStatic(versions[i]);
        }
        this.unlockSize();
      }
    }
  });

  function goAbsolute(version, size) {
    if (!version.view) {
      return;
    }
    var elt = version.view.$();
    var pos = elt.position();
    if (!size) {
      size = liquid_measured.measure(elt);
    }
    elt.outerWidth(size.width);
    elt.outerHeight(size.height);
    elt.css({
      position: "absolute",
      top: pos.top,
      left: pos.left
    });
  }

  function goStatic(version) {
    if (version.view) {
      version.view.$().css({ width: "", height: "", position: "" });
    }
  }

});
define('icarus/components/liquid-if', ['exports', 'ember', 'liquid-fire/ember-internals'], function (exports, Ember, ember_internals) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    positionalParams: ['predicate'],
    tagName: '',
    helperName: 'liquid-if',
    didReceiveAttrs: function didReceiveAttrs() {
      var predicate = ember_internals.shouldDisplay(this.getAttr('predicate'));
      this.set('showFirstBlock', this.inverted ? !predicate : predicate);
    }
  });

});
define('icarus/components/liquid-measured', ['exports', 'liquid-fire/components/liquid-measured'], function (exports, liquid_measured) {

	'use strict';



	exports.default = liquid_measured.default;
	exports.measure = liquid_measured.measure;

});
define('icarus/components/liquid-modal', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    classNames: ['liquid-modal'],
    currentContext: Ember['default'].computed('owner.modalContexts.lastObject', function () {
      var context = this.get('owner.modalContexts.lastObject');
      if (context) {
        context.view = this.innerView(context);
      }
      return context;
    }),

    owner: Ember['default'].inject.service('liquid-fire-modals'),

    innerView: function innerView(current) {
      var self = this,
          name = current.get('name'),
          container = this.get('container'),
          component = container.lookup('component-lookup:main').lookupFactory(name);
      Ember['default'].assert('Tried to render a modal using component \'' + name + '\', but couldn\'t find it.', !!component);

      var args = Ember['default'].copy(current.get('params'));

      args.registerMyself = Ember['default'].on('init', function () {
        self.set('innerViewInstance', this);
      });

      // set source so we can bind other params to it
      args._source = Ember['default'].computed(function () {
        return current.get('source');
      });

      var otherParams = current.get('options.otherParams');
      var from, to;
      for (from in otherParams) {
        to = otherParams[from];
        args[to] = Ember['default'].computed.alias('_source.' + from);
      }

      var actions = current.get('options.actions') || {};

      // Override sendAction in the modal component so we can intercept and
      // dynamically dispatch to the controller as expected
      args.sendAction = function (name) {
        var actionName = actions[name];
        if (!actionName) {
          this._super.apply(this, Array.prototype.slice.call(arguments));
          return;
        }

        var controller = current.get('source');
        var args = Array.prototype.slice.call(arguments, 1);
        args.unshift(actionName);
        controller.send.apply(controller, args);
      };

      return component.extend(args);
    },

    actions: {
      outsideClick: function outsideClick() {
        if (this.get('currentContext.options.dismissWithOutsideClick')) {
          this.send('dismiss');
        } else {
          proxyToInnerInstance(this, 'outsideClick');
        }
      },
      escape: function escape() {
        if (this.get('currentContext.options.dismissWithEscape')) {
          this.send('dismiss');
        } else {
          proxyToInnerInstance(this, 'escape');
        }
      },
      dismiss: function dismiss() {
        var source = this.get('currentContext.source'),
            proto = source.constructor.proto(),
            params = this.get('currentContext.options.withParams'),
            clearThem = {};

        for (var key in params) {
          if (proto[key] instanceof Ember['default'].ComputedProperty) {
            clearThem[key] = undefined;
          } else {
            clearThem[key] = proto[key];
          }
        }
        source.setProperties(clearThem);
      }
    }
  });

  function proxyToInnerInstance(self, message) {
    var vi = self.get('innerViewInstance');
    if (vi) {
      vi.send(message);
    }
  }

});
define('icarus/components/liquid-outlet', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    positionalParams: ['inputOutletName'],
    tagName: '',
    didReceiveAttrs: function didReceiveAttrs() {
      this.set('outletName', this.attrs.inputOutletName || 'main');
    }
  });

});
define('icarus/components/liquid-spacer', ['exports', 'liquid-fire/components/liquid-spacer'], function (exports, liquid_spacer) {

	'use strict';



	exports.default = liquid_spacer.default;

});
define('icarus/components/liquid-unless', ['exports', 'icarus/components/liquid-if'], function (exports, LiquidIf) {

  'use strict';

  exports['default'] = LiquidIf['default'].extend({
    helperName: 'liquid-unless',
    layoutName: 'components/liquid-if',
    inverted: true
  });

});
define('icarus/components/liquid-versions', ['exports', 'ember', 'liquid-fire/ember-internals'], function (exports, Ember, ember_internals) {

  'use strict';

  var get = Ember['default'].get;
  var set = Ember['default'].set;

  exports['default'] = Ember['default'].Component.extend({
    tagName: "",
    name: "liquid-versions",

    transitionMap: Ember['default'].inject.service("liquid-fire-transitions"),

    didReceiveAttrs: function didReceiveAttrs() {
      if (!this.versions || this._lastVersion !== this.getAttr("value")) {
        this.appendVersion();
        this._lastVersion = this.getAttr("value");
      }
    },

    appendVersion: function appendVersion() {
      var versions = this.versions;
      var firstTime = false;
      var newValue = this.getAttr("value");
      var oldValue;

      if (!versions) {
        firstTime = true;
        versions = Ember['default'].A();
      } else {
        oldValue = versions[0];
      }

      // TODO: may need to extend the comparison to do the same kind of
      // key-based diffing that htmlbars is doing.
      if (!firstTime && (!oldValue && !newValue || oldValue === newValue)) {
        return;
      }

      this.notifyContainer("willTransition", versions);
      var newVersion = {
        value: newValue,
        shouldRender: newValue || get(this, "renderWhenFalse")
      };
      newVersion.guid = Ember['default'].guidFor(newVersion);
      versions.unshiftObject(newVersion);

      this.firstTime = firstTime;
      if (firstTime) {
        set(this, "versions", versions);
      }

      if (!newVersion.shouldRender && !firstTime) {
        this._transition();
      }
    },

    _transition: function _transition() {
      var _this = this;

      var versions = get(this, "versions");
      var transition;
      var firstTime = this.firstTime;
      this.firstTime = false;

      this.notifyContainer("afterChildInsertion", versions);

      transition = get(this, "transitionMap").transitionFor({
        versions: versions,
        parentElement: Ember['default'].$(ember_internals.containingElement(this)),
        use: get(this, "use"),
        // Using strings instead of booleans here is an
        // optimization. The constraint system can match them more
        // efficiently, since it treats boolean constraints as generic
        // "match anything truthy/falsy" predicates, whereas string
        // checks are a direct object property lookup.
        firstTime: firstTime ? "yes" : "no",
        helperName: get(this, "name")
      });

      if (this._runningTransition) {
        this._runningTransition.interrupt();
      }
      this._runningTransition = transition;

      transition.run().then(function (wasInterrupted) {
        // if we were interrupted, we don't handle the cleanup because
        // another transition has already taken over.
        if (!wasInterrupted) {
          _this.finalizeVersions(versions);
          _this.notifyContainer("afterTransition", versions);
        }
      }, function (err) {
        _this.finalizeVersions(versions);
        _this.notifyContainer("afterTransition", versions);
        throw err;
      });
    },

    finalizeVersions: function finalizeVersions(versions) {
      versions.replace(1, versions.length - 1);
    },

    notifyContainer: function notifyContainer(method, versions) {
      var target = get(this, "notify");
      if (target) {
        target.send(method, versions);
      }
    },

    actions: {
      childDidRender: function childDidRender(child) {
        var version = get(child, "version");
        set(version, "view", child);
        this._transition();
      }
    }

  });

});
define('icarus/components/liquid-with', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    name: 'liquid-with',
    positionalParams: ['value'],
    tagName: ''
  });

});
define('icarus/components/lm-container', ['exports', 'ember', 'liquid-fire/tabbable'], function (exports, Ember) {

  'use strict';

  /*
     Parts of this file were adapted from ic-modal

     https://github.com/instructure/ic-modal
     Released under The MIT License (MIT)
     Copyright (c) 2014 Instructure, Inc.
  */

  var lastOpenedModal = null;
  Ember['default'].$(document).on("focusin", handleTabIntoBrowser);

  function handleTabIntoBrowser() {
    if (lastOpenedModal) {
      lastOpenedModal.focus();
    }
  }

  exports['default'] = Ember['default'].Component.extend({
    classNames: ["lm-container"],
    attributeBindings: ["tabindex"],
    tabindex: 0,

    keyUp: function keyUp(event) {
      // Escape key
      if (event.keyCode === 27) {
        this.sendAction();
      }
    },

    keyDown: function keyDown(event) {
      // Tab key
      if (event.keyCode === 9) {
        this.constrainTabNavigation(event);
      }
    },

    didInsertElement: function didInsertElement() {
      this.focus();
      lastOpenedModal = this;
    },

    willDestroy: function willDestroy() {
      lastOpenedModal = null;
    },

    focus: function focus() {
      if (this.get("element").contains(document.activeElement)) {
        // just let it be if we already contain the activeElement
        return;
      }
      var target = this.$("[autofocus]");
      if (!target.length) {
        target = this.$(":tabbable");
      }

      if (!target.length) {
        target = this.$();
      }

      target[0].focus();
    },

    constrainTabNavigation: function constrainTabNavigation(event) {
      var tabbable = this.$(":tabbable");
      var finalTabbable = tabbable[event.shiftKey ? "first" : "last"]()[0];
      var leavingFinalTabbable = finalTabbable === document.activeElement ||
      // handle immediate shift+tab after opening with mouse
      this.get("element") === document.activeElement;
      if (!leavingFinalTabbable) {
        return;
      }
      event.preventDefault();
      tabbable[event.shiftKey ? "last" : "first"]()[0].focus();
    },

    click: function click(event) {
      if (event.target === this.get("element")) {
        this.sendAction("clickAway");
      }
    }
  });

});
define('icarus/components/voting-arrows', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({

    classNames: ['voting-arrows'],

    attributeBindings: ['lid:data-voting-id'],

    lid: null,

    actions: {
      vote: function vote() {
        this.sendAction('toggleVote');
      }
    }
  });

});
define('icarus/components/voting-score', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({

    /**
     * Give the voting arrows a unique ID that corresponds to the event being represented
     * Used for liquid-fire transitions
     */
    attributeBindings: ['lid:data-score-id'],

    lid: null,

    /**
     * Class names
     */
    classNames: ['score']

  });

});
define('icarus/controllers/application', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({

    session: Ember['default'].inject.service()

  });

});
define('icarus/controllers/array', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Controller;

});
define('icarus/controllers/object', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Controller;

});
define('icarus/controllers/talk', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({

    actions: {
      upvote: function upvote() {
        var event = this.get('model');
        event.upvote();
      }
    }
  });

});
define('icarus/initializers/emberfire', ['exports', 'emberfire/initializers/emberfire'], function (exports, EmberFireInitializer) {

	'use strict';

	exports['default'] = EmberFireInitializer['default'];

});
define('icarus/initializers/export-application-global', ['exports', 'ember', 'icarus/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports.initialize = initialize;

  function initialize(container, application) {
    var classifiedName = Ember['default'].String.classify(config['default'].modulePrefix);

    if (config['default'].exportApplicationGlobal && !window[classifiedName]) {
      window[classifiedName] = application;
    }
  }

  ;

  exports['default'] = {
    name: 'export-application-global',

    initialize: initialize
  };

});
define('icarus/initializers/liquid-fire', ['exports', 'liquid-fire/router-dsl-ext', 'liquid-fire/ember-internals'], function (exports, __dep0__, ember_internals) {

  'use strict';

  // This initializer exists only to make sure that the following
  // imports happen before the app boots.
  ember_internals.registerKeywords();

  exports['default'] = {
    name: "liquid-fire",
    initialize: function initialize() {}
  };

});
define('icarus/instance-initializers/app-version', ['exports', 'icarus/config/environment', 'ember'], function (exports, config, Ember) {

  'use strict';

  var classify = Ember['default'].String.classify;
  var registered = false;

  exports['default'] = {
    name: 'App Version',
    initialize: function initialize(application) {
      if (!registered) {
        var appName = classify(application.toString());
        Ember['default'].libraries.register(appName, config['default'].APP.version);
        registered = true;
      }
    }
  };

});
define('icarus/instance-initializers/track-pageviews', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports.initialize = initialize;

  var on = Ember['default'].on;

  function initialize(instance) {
    var track = instance.registry.lookup('service:track');

    Ember['default'].Router.reopen({
      trackPageview: on('didTransition', function () {
        track.track('Page View', {
          'Name': document.title,
          'URL': window.location.pathname
        });
      })
    });
  }

  exports['default'] = {
    name: 'track-pageviews',
    initialize: initialize
  };

});
define('icarus/models/talk', ['exports', 'ember', 'ember-data'], function (exports, Ember, DS) {

  'use strict';

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  var RSVP = Ember['default'].RSVP;
  var computed = Ember['default'].computed;
  var inject = Ember['default'].inject;
  var service = inject.service;
  var Model = DS['default'].Model;
  var attr = DS['default'].attr;
  var hasMany = DS['default'].hasMany;

  exports['default'] = Model.extend({

    /**
     * Reference to the session service, to get the current user
     */
    session: service(),

    /**
     * The title of the talk
     * @property title
     * @type {String}
     */
    title: attr('string'),

    body: attr('string'),

    votes: hasMany('votes', { async: true }),

    /**
     * Number of votes for this talk
     *
     * Required because, due to come weird behavior in Firebase, there seems to be
     * situations where the array of votes will have multiple instances of a vote,
     * even if the database only has one.  This property ensures that the votes in
     * the array are unique before getting the length.
     *
     * @property {Number} numVotes
     */
    numVotes: computed('votes', function () {
      return this.get('votes').uniq().length;
    }),

    isUpvoted: computed('votes.@each.user', 'session.currentUser', function () {
      var user = this.get('session.currentUser');
      return this.get('votes').mapBy('user.content').contains(user);
    }),

    /**
     * Toggles a vote from the current user
     *
     * Gets the current user and either creates or destroys the vote, based on
     * whether or not one already exists
     *
     * @method toggleVote
     * @return {RSVP.Promise}
     */
    toggleVote: function toggleVote() {
      var user = this.get('session.currentUser');
      // Short-circuit if the user is not logged in
      if (!user) {
        return RSVP.reject('User is not logged in');
      }

      // Create/destroy the vote
      if (this.get('isUpvoted')) {
        return this.removeVote(user);
      } else {
        return this.addVote(user);
      }
    },

    /**
     * Add a vote
     *
     * @method addVote
     * @param {User} user
     * @return {RSVP.Promise}
     */
    addVote: function addVote(user) {
      var vote = this.get('store').createRecord('vote', {
        talk: this,
        user: user
      });
      this.get('votes').addObject(vote);
      user.get('votes').addObject(vote);
      return RSVP.all([user.save(), vote.save(), this.save()]);
    },

    /**
     * Remove a vote
     *
     * @method removeVote
     * @param {User} user
     * @return {RSVP.Promise}
     */
    removeVote: function removeVote(user) {
      var _this = this;

      var _get$filterBy = this.get('votes').filterBy('user.content', user);

      var _get$filterBy2 = _slicedToArray(_get$filterBy, 1);

      var vote = _get$filterBy2[0];

      return vote.destroyRecord().then(function () {
        return _this.save();
      });
    }

  });

});
define('icarus/models/user', ['exports', 'ember', 'ember-data'], function (exports, Ember, DS) {

  'use strict';

  var computed = Ember['default'].computed;
  var Model = DS['default'].Model;
  var attr = DS['default'].attr;
  var hasMany = DS['default'].hasMany;

  exports['default'] = Model.extend({

    /**
     * Authentication UUID for the user
     *
     * @property uuid
     */
    uid: attr('string'),

    /**
     * First Name
     *
     * @property firstName
     */
    firstName: attr('string'),

    /**
     * Last Name
     *
     * @property lastName
     */
    lastName: attr('string'),

    /**
     * Username
     *
     * @property username
     */
    userName: attr('string'),

    /**
     * Full name
     *
     * @property fullName
     */
    fullName: computed('firstName', 'lastName', function () {
      var firstName = this.get('firstName');
      var lastName = this.get('lastName');
      return firstName + ' ' + lastName;
    }),

    votes: hasMany('votes', { async: true })

  });

});
define('icarus/models/vote', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  var Model = DS['default'].Model;
  var belongsTo = DS['default'].belongsTo;

  exports['default'] = Model.extend({

    user: belongsTo('user', { async: true }),

    talk: belongsTo('talk', { async: true })

  });

});
define('icarus/router', ['exports', 'ember', 'icarus/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  Router.map(function () {
    this.route('talk', { path: 'talks/:id' });
    this.route('talks');
  });

  exports['default'] = Router;

});
define('icarus/routes/application', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var inject = Ember['default'].inject;
  var service = inject.service;

  exports['default'] = Ember['default'].Route.extend({

    session: service(),

    actions: {
      login: function login() {
        this.get('session').login();
      }
    }

  });

});
define('icarus/routes/index', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      return this.store.findAll('talk');
    }
  });

});
define('icarus/routes/talk', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model(params) {
      return this.store.find('talk', params.id);
    }
  });

});
define('icarus/routes/talks', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    redirect: function redirect() {
      this.transitionTo('index', { queryParams: { show: 'talks' } });
    }
  });

});
define('icarus/routes/workshops', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend({});

});
define('icarus/services/firebase', ['exports', 'emberfire/services/firebase', 'icarus/config/environment'], function (exports, Firebase, config) {

	'use strict';

	Firebase['default'].config = config['default'];

	exports['default'] = Firebase['default'];

});
define('icarus/services/liquid-fire-modals', ['exports', 'liquid-fire/modals'], function (exports, Modals) {

	'use strict';

	exports['default'] = Modals['default'];

});
define('icarus/services/liquid-fire-transitions', ['exports', 'liquid-fire/transition-map'], function (exports, TransitionMap) {

	'use strict';

	exports['default'] = TransitionMap['default'];

});
define('icarus/services/session', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  var RSVP = Ember['default'].RSVP;
  var computed = Ember['default'].computed;
  var inject = Ember['default'].inject;
  var on = Ember['default'].on;
  var run = Ember['default'].run;
  var bool = computed.bool;
  var service = inject.service;

  exports['default'] = Ember['default'].Service.extend({

    store: service(),

    firebase: computed(function () {
      return this.container.lookup('adapter:application').get('firebase');
    }),

    currentUser: null,

    isAuthenticated: bool('currentUser'),

    onAuthentication: on('init', function () {
      var _this = this;

      this.get('firebase').onAuth(function (authData) {
        if (!authData) {
          _this.set('currentUser', null);
          return;
        }
        _this._userWithUid(authData.uid).then(function (user) {
          // Set the user if we found one in the database
          _this.set('currentUser', user);
        });
      });
    }),

    login: function login() {
      this.get('firebase').authWithOAuthPopup('github', run.bind(this, this._onAuthCallback));
    },

    _onAuthCallback: function _onAuthCallback(error, user) {
      if (error) {
        this._onAuthFailure(error);
      } else {
        this._onAuthSuccess(user);
      }
    },

    _onAuthSuccess: function _onAuthSuccess(authData) {
      var _this2 = this;

      this._userWithUid(authData.uid).then(function (user) {
        _this2.set('currentUser', user);
      })['catch'](function () {
        // Couldn't find the user; need to make it
        var github = authData.github;
        var uid = authData.uid;

        var _github$displayName$split = github.displayName.split(' ');

        var _github$displayName$split2 = _slicedToArray(_github$displayName$split, 2);

        var firstName = _github$displayName$split2[0];
        var lastName = _github$displayName$split2[1];

        var userName = github.username;
        _this2.get('store').createRecord('user', {
          uid: uid,
          firstName: firstName,
          lastName: lastName,
          userName: userName
        }).save().then(function (user) {
          _this2.set('currentUser', user);
        });
      });
    },

    _onAuthFailure: function _onAuthFailure(error) {
      console.error(error);
    },

    /**
     * Fetch a user by the UID returned as part of authentication
     *
     * @method _userWithUid
     * @param {String} uid
     * @returns {RSVP.Promise}
     */
    _userWithUid: function _userWithUid(uid) {
      return this.get('store').query('user', { orderBy: 'uid', equalTo: uid }).then(function (users) {
        var user = users.get('firstObject');
        if (user) {
          return user;
        } else {
          return RSVP.reject();
        }
      });
    }

  });

});
define('icarus/services/track', ['exports', 'ember', 'icarus/config/environment'], function (exports, Ember, config) {

  'use strict';

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  exports['default'] = Ember['default'].Service.extend({

    /**
     * Store events tracked before initialization is done
     */
    _store: [],

    /**
     * Is the service available?
     * Determiend based on the presense of the token
     */
    _available: Ember['default'].computed({
      get: function get() {
        return Ember['default'].isPresent(config['default'].MIXPANEL_TOKEN) && config['default'].MIXPANEL_ENABLE;
      }
    }),

    /**
     * Is the service initialized?
     */
    _initialized: false,

    /**
     * If the service is available, initialize Mixpanel with the token
     * Gets token from an environment variable
     */
    init: function init() {
      var _this = this;

      // If the mixpanel token is available, initialize mixpanel with it
      if (this.get('_available')) {
        // Initialize service
        window.mixpanel.init(config['default'].MIXPANEL_TOKEN);
        this.set('_initialized', true);

        // Empty store of events to track
        Ember['default'].RSVP.all(this.get('_store').map(function (item) {
          var _item = _slicedToArray(item, 2);

          var event = _item[0];
          var data = _item[1];

          return _this.track(event, data);
        })).then(function () {
          _this.set('_store', []);
        });
      }
    },

    /**
     * Track an event if the library is available
     * @method track
     * @returns {RSVP.Promise}
     */
    track: function track(event, data) {
      // If the tracker isn't available yet, store the request for later
      if (!this.get('_initialized')) {
        var store = this.get('_store');
        store.push([event, data]);
        return Ember['default'].RSVP.resolve();
      }

      // If it is available, just sent the request now
      return new Ember['default'].RSVP.Promise(function (resolve) {
        window.mixpanel.track(event, data, function () {
          resolve();
        });
      });
    }

  });

});
define('icarus/templates/application', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 6,
              "column": 2
            },
            "end": {
              "line": 10,
              "column": 2
            }
          },
          "moduleName": "icarus/templates/application.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","login");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2,"href","#");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode(" ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("i");
          dom.setAttribute(el3,"class","fa fa-caret-down");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1, 1]),0,0);
          return morphs;
        },
        statements: [
          ["content","session.currentUser.fullName",["loc",[null,[8,18],[8,50]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    var child1 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 10,
              "column": 2
            },
            "end": {
              "line": 14,
              "column": 2
            }
          },
          "moduleName": "icarus/templates/application.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","login");
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("a");
          dom.setAttribute(el2,"href","#");
          var el3 = dom.createTextNode("Login");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1, 1]);
          var morphs = new Array(1);
          morphs[0] = dom.createElementMorph(element0);
          return morphs;
        },
        statements: [
          ["element","action",["login"],[],["loc",[null,[12,18],[12,36]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 26,
            "column": 0
          }
        },
        "moduleName": "icarus/templates/application.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("header");
        dom.setAttribute(el1,"class","container");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","title");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("footer");
        dom.setAttribute(el1,"class","container");
        var el2 = dom.createTextNode("\n  Created by\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://github.com/Pitt-CSC/icarus/graphs/contributors");
        var el3 = dom.createTextNode("\n    Alex LaFroscia and Others\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" for the ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","http://pittcsc.org");
        var el3 = dom.createTextNode("Pitt CSC");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element1 = dom.childAt(fragment, [0]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(dom.childAt(element1, [1]),1,1);
        morphs[1] = dom.createMorphAt(element1,3,3);
        morphs[2] = dom.createMorphAt(fragment,2,2,contextualElement);
        return morphs;
      },
      statements: [
        ["inline","link-to",["Icarus","index"],[],["loc",[null,[3,4],[3,32]]]],
        ["block","if",[["get","session.isAuthenticated",["loc",[null,[6,8],[6,31]]]]],[],0,1,["loc",[null,[6,2],[14,9]]]],
        ["content","liquid-outlet",["loc",[null,[18,0],[18,17]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('icarus/templates/components/event-list-item', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 6,
              "column": 0
            }
          },
          "moduleName": "icarus/templates/components/event-list-item.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["inline","voting-arrows",[],["lid",["subexpr","@mut",[["get","event.id",["loc",[null,[3,10],[3,18]]]]],[],[]],"isUpvoted",["subexpr","@mut",[["get","event.isUpvoted",["loc",[null,[4,16],[4,31]]]]],[],[]],"toggleVote","upvote"],["loc",[null,[2,2],[5,27]]]]
        ],
        locals: [],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 14,
            "column": 0
          }
        },
        "moduleName": "icarus/templates/components/event-list-item.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","text");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h4");
        dom.setAttribute(el2,"class","title");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("p");
        var el3 = dom.createTextNode("Cras quis eros eget felis fringilla mollis sit amet id nulla. Class aptent taciti sociosqu ad litora torquent per conubia.");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [2, 1]);
        var morphs = new Array(4);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        morphs[1] = dom.createAttrMorph(element0, 'data-title-id');
        morphs[2] = dom.createMorphAt(element0,0,0);
        morphs[3] = dom.createMorphAt(fragment,4,4,contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [
        ["block","if",[["get","session.isAuthenticated",["loc",[null,[1,7],[1,30]]]]],[],0,null,["loc",[null,[1,0],[6,7]]]],
        ["attribute","data-title-id",["get","event.id",["loc",[null,[9,22],[9,30]]]]],
        ["inline","link-to",[["get","title",["loc",[null,[9,57],[9,62]]]],"talk",["get","event",["loc",[null,[9,70],[9,75]]]]],[],["loc",[null,[9,47],[9,77]]]],
        ["inline","voting-score",[],["score",["subexpr","@mut",[["get","score",["loc",[null,[13,21],[13,26]]]]],[],[]],"lid",["subexpr","@mut",[["get","event.id",["loc",[null,[13,31],[13,39]]]]],[],[]]],["loc",[null,[13,0],[13,41]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('icarus/templates/components/liquid-bind', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.3",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 5,
                "column": 2
              }
            },
            "moduleName": "icarus/templates/components/liquid-bind.hbs"
          },
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["content","version",["loc",[null,[4,4],[4,18]]]]
          ],
          locals: ["version"],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 6,
              "column": 0
            }
          },
          "moduleName": "icarus/templates/components/liquid-bind.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-versions",[],["value",["subexpr","@mut",[["get","attrs.value",["loc",[null,[2,28],[2,39]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[2,44],[2,47]]]]],[],[]],"name","liquid-bind","renderWhenFalse",true,"class",["subexpr","@mut",[["get","class",["loc",[null,[3,67],[3,72]]]]],[],[]]],0,null,["loc",[null,[2,2],[5,24]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 15,
                  "column": 4
                },
                "end": {
                  "line": 18,
                  "column": 4
                }
              },
              "moduleName": "icarus/templates/components/liquid-bind.hbs"
            },
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [
              ["content","version",["loc",[null,[17,6],[17,20]]]]
            ],
            locals: ["version"],
            templates: []
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.3",
            "loc": {
              "source": null,
              "start": {
                "line": 7,
                "column": 2
              },
              "end": {
                "line": 19,
                "column": 2
              }
            },
            "moduleName": "icarus/templates/components/liquid-bind.hbs"
          },
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","liquid-versions",[],["value",["subexpr","@mut",[["get","attrs.value",["loc",[null,[15,30],[15,41]]]]],[],[]],"notify",["subexpr","@mut",[["get","container",["loc",[null,[15,49],[15,58]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[15,63],[15,66]]]]],[],[]],"name","liquid-bind","renderWhenFalse",true],0,null,["loc",[null,[15,4],[18,26]]]]
          ],
          locals: ["container"],
          templates: [child0]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 6,
              "column": 0
            },
            "end": {
              "line": 20,
              "column": 0
            }
          },
          "moduleName": "icarus/templates/components/liquid-bind.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-container",[],["id",["subexpr","@mut",[["get","id",["loc",[null,[8,9],[8,11]]]]],[],[]],"class",["subexpr","@mut",[["get","class",["loc",[null,[9,12],[9,17]]]]],[],[]],"growDuration",["subexpr","@mut",[["get","growDuration",["loc",[null,[10,19],[10,31]]]]],[],[]],"growPixelsPerSecond",["subexpr","@mut",[["get","growPixelsPerSecond",["loc",[null,[11,26],[11,45]]]]],[],[]],"growEasing",["subexpr","@mut",[["get","growEasing",["loc",[null,[12,17],[12,27]]]]],[],[]],"enableGrowth",["subexpr","@mut",[["get","enableGrowth",["loc",[null,[13,19],[13,31]]]]],[],[]]],0,null,["loc",[null,[7,2],[19,25]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 21,
            "column": 0
          }
        },
        "moduleName": "icarus/templates/components/liquid-bind.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","if",[["get","containerless",["loc",[null,[1,6],[1,19]]]]],[],0,1,["loc",[null,[1,0],[20,7]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('icarus/templates/components/liquid-container', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 1,
            "column": 14
          }
        },
        "moduleName": "icarus/templates/components/liquid-container.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["inline","yield",[["get","this",["loc",[null,[1,8],[1,12]]]]],[],["loc",[null,[1,0],[1,14]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('icarus/templates/components/liquid-if', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 4,
                  "column": 4
                },
                "end": {
                  "line": 6,
                  "column": 4
                }
              },
              "moduleName": "icarus/templates/components/liquid-if.hbs"
            },
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("      ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
              return morphs;
            },
            statements: [
              ["content","yield",["loc",[null,[5,6],[5,15]]]]
            ],
            locals: [],
            templates: []
          };
        }());
        var child1 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 6,
                  "column": 4
                },
                "end": {
                  "line": 8,
                  "column": 4
                }
              },
              "moduleName": "icarus/templates/components/liquid-if.hbs"
            },
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("      ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
              return morphs;
            },
            statements: [
              ["inline","yield",[],["to","inverse"],["loc",[null,[7,6],[7,28]]]]
            ],
            locals: [],
            templates: []
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.3",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 9,
                "column": 2
              }
            },
            "moduleName": "icarus/templates/components/liquid-if.hbs"
          },
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","if",[["get","valueVersion",["loc",[null,[4,10],[4,22]]]]],[],0,1,["loc",[null,[4,4],[8,11]]]]
          ],
          locals: ["valueVersion"],
          templates: [child0, child1]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 10,
              "column": 0
            }
          },
          "moduleName": "icarus/templates/components/liquid-if.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-versions",[],["value",["subexpr","@mut",[["get","showFirstBlock",["loc",[null,[2,27],[2,41]]]]],[],[]],"name",["subexpr","@mut",[["get","helperName",["loc",[null,[2,47],[2,57]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[3,27],[3,30]]]]],[],[]],"renderWhenFalse",["subexpr","hasBlock",["inverse"],[],["loc",[null,[3,47],[3,67]]]],"class",["subexpr","@mut",[["get","class",["loc",[null,[3,74],[3,79]]]]],[],[]]],0,null,["loc",[null,[2,2],[9,22]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          var child0 = (function() {
            return {
              meta: {
                "revision": "Ember@1.13.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 21,
                    "column": 6
                  },
                  "end": {
                    "line": 23,
                    "column": 6
                  }
                },
                "moduleName": "icarus/templates/components/liquid-if.hbs"
              },
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("        ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
                return morphs;
              },
              statements: [
                ["content","yield",["loc",[null,[22,8],[22,17]]]]
              ],
              locals: [],
              templates: []
            };
          }());
          var child1 = (function() {
            return {
              meta: {
                "revision": "Ember@1.13.3",
                "loc": {
                  "source": null,
                  "start": {
                    "line": 23,
                    "column": 6
                  },
                  "end": {
                    "line": 25,
                    "column": 6
                  }
                },
                "moduleName": "icarus/templates/components/liquid-if.hbs"
              },
              arity: 0,
              cachedFragment: null,
              hasRendered: false,
              buildFragment: function buildFragment(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("        ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
                var morphs = new Array(1);
                morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
                return morphs;
              },
              statements: [
                ["inline","yield",[],["to","inverse"],["loc",[null,[24,8],[24,30]]]]
              ],
              locals: [],
              templates: []
            };
          }());
          return {
            meta: {
              "revision": "Ember@1.13.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 19,
                  "column": 4
                },
                "end": {
                  "line": 26,
                  "column": 4
                }
              },
              "moduleName": "icarus/templates/components/liquid-if.hbs"
            },
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [
              ["block","if",[["get","valueVersion",["loc",[null,[21,12],[21,24]]]]],[],0,1,["loc",[null,[21,6],[25,13]]]]
            ],
            locals: ["valueVersion"],
            templates: [child0, child1]
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.3",
            "loc": {
              "source": null,
              "start": {
                "line": 11,
                "column": 2
              },
              "end": {
                "line": 27,
                "column": 2
              }
            },
            "moduleName": "icarus/templates/components/liquid-if.hbs"
          },
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","liquid-versions",[],["value",["subexpr","@mut",[["get","showFirstBlock",["loc",[null,[19,29],[19,43]]]]],[],[]],"notify",["subexpr","@mut",[["get","container",["loc",[null,[19,51],[19,60]]]]],[],[]],"name",["subexpr","@mut",[["get","helperName",["loc",[null,[19,66],[19,76]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[20,8],[20,11]]]]],[],[]],"renderWhenFalse",["subexpr","hasBlock",["inverse"],[],["loc",[null,[20,28],[20,48]]]]],0,null,["loc",[null,[19,4],[26,24]]]]
          ],
          locals: ["container"],
          templates: [child0]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 10,
              "column": 0
            },
            "end": {
              "line": 28,
              "column": 0
            }
          },
          "moduleName": "icarus/templates/components/liquid-if.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-container",[],["id",["subexpr","@mut",[["get","id",["loc",[null,[12,9],[12,11]]]]],[],[]],"class",["subexpr","@mut",[["get","class",["loc",[null,[13,12],[13,17]]]]],[],[]],"growDuration",["subexpr","@mut",[["get","growDuration",["loc",[null,[14,19],[14,31]]]]],[],[]],"growPixelsPerSecond",["subexpr","@mut",[["get","growPixelsPerSecond",["loc",[null,[15,26],[15,45]]]]],[],[]],"growEasing",["subexpr","@mut",[["get","growEasing",["loc",[null,[16,17],[16,27]]]]],[],[]],"enableGrowth",["subexpr","@mut",[["get","enableGrowth",["loc",[null,[17,19],[17,31]]]]],[],[]]],0,null,["loc",[null,[11,2],[27,23]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 29,
            "column": 0
          }
        },
        "moduleName": "icarus/templates/components/liquid-if.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","if",[["get","containerless",["loc",[null,[1,6],[1,19]]]]],[],0,1,["loc",[null,[1,0],[28,7]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('icarus/templates/components/liquid-modal', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.3",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 6,
                "column": 2
              }
            },
            "moduleName": "icarus/templates/components/liquid-modal.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"role","dialog");
            var el2 = dom.createTextNode("\n      ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n    ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var element0 = dom.childAt(fragment, [1]);
            var morphs = new Array(4);
            morphs[0] = dom.createAttrMorph(element0, 'class');
            morphs[1] = dom.createAttrMorph(element0, 'aria-labelledby');
            morphs[2] = dom.createAttrMorph(element0, 'aria-label');
            morphs[3] = dom.createMorphAt(element0,1,1);
            return morphs;
          },
          statements: [
            ["attribute","class",["concat",["lf-dialog ",["get","cc.options.dialogClass",["loc",[null,[3,28],[3,50]]]]]]],
            ["attribute","aria-labelledby",["get","cc.options.ariaLabelledBy",["loc",[null,[3,86],[3,111]]]]],
            ["attribute","aria-label",["get","cc.options.ariaLabel",["loc",[null,[3,127],[3,147]]]]],
            ["inline","view",[["get","cc.view",["loc",[null,[4,13],[4,20]]]]],["dismiss","dismiss"],["loc",[null,[4,6],[4,40]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 8,
              "column": 0
            }
          },
          "moduleName": "icarus/templates/components/liquid-modal.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(2);
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          morphs[1] = dom.createMorphAt(fragment,2,2,contextualElement);
          dom.insertBoundary(fragment, 0);
          return morphs;
        },
        statements: [
          ["block","lm-container",[],["action","escape","clickAway","outsideClick"],0,null,["loc",[null,[2,2],[6,19]]]],
          ["content","lf-overlay",["loc",[null,[7,2],[7,16]]]]
        ],
        locals: ["cc"],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 9,
            "column": 0
          }
        },
        "moduleName": "icarus/templates/components/liquid-modal.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","liquid-versions",[],["name","liquid-modal","value",["subexpr","@mut",[["get","currentContext",["loc",[null,[1,45],[1,59]]]]],[],[]],"renderWhenFalse",false],0,null,["loc",[null,[1,0],[8,20]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('icarus/templates/components/liquid-outlet', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 14,
                  "column": 6
                },
                "end": {
                  "line": 16,
                  "column": 6
                }
              },
              "moduleName": "icarus/templates/components/liquid-outlet.hbs"
            },
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [
              ["inline","outlet",[["get","outletName",["loc",[null,[15,17],[15,27]]]]],[],["loc",[null,[15,8],[15,29]]]]
            ],
            locals: [],
            templates: []
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.3",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 18,
                "column": 2
              }
            },
            "moduleName": "icarus/templates/components/liquid-outlet.hbs"
          },
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","set-outlet-state",[["get","outletName",["loc",[null,[14,26],[14,36]]]],["get","version.outletState",["loc",[null,[14,37],[14,56]]]]],[],0,null,["loc",[null,[14,6],[16,28]]]]
          ],
          locals: ["version"],
          templates: [child0]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 19,
              "column": 0
            }
          },
          "moduleName": "icarus/templates/components/liquid-outlet.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-with",[["get","outletState",["loc",[null,[2,17],[2,28]]]]],["id",["subexpr","@mut",[["get","id",["loc",[null,[3,9],[3,11]]]]],[],[]],"class",["subexpr","@mut",[["get","class",["loc",[null,[4,12],[4,17]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[5,10],[5,13]]]]],[],[]],"name","liquid-outlet","containerless",["subexpr","@mut",[["get","containerless",["loc",[null,[7,20],[7,33]]]]],[],[]],"growDuration",["subexpr","@mut",[["get","growDuration",["loc",[null,[8,19],[8,31]]]]],[],[]],"growPixelsPerSecond",["subexpr","@mut",[["get","growPixelsPerSecond",["loc",[null,[9,26],[9,45]]]]],[],[]],"growEasing",["subexpr","@mut",[["get","growEasing",["loc",[null,[10,17],[10,27]]]]],[],[]],"enableGrowth",["subexpr","@mut",[["get","enableGrowth",["loc",[null,[11,19],[11,31]]]]],[],[]]],0,null,["loc",[null,[2,2],[18,20]]]]
        ],
        locals: ["outletState"],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 19,
            "column": 21
          }
        },
        "moduleName": "icarus/templates/components/liquid-outlet.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","get-outlet-state",[["get","outletName",["loc",[null,[1,21],[1,31]]]]],[],0,null,["loc",[null,[1,0],[19,21]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('icarus/templates/components/liquid-versions', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 3,
                  "column": 4
                },
                "end": {
                  "line": 5,
                  "column": 4
                }
              },
              "moduleName": "icarus/templates/components/liquid-versions.hbs"
            },
            arity: 0,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [
              ["inline","yield",[["get","version.value",["loc",[null,[4,14],[4,27]]]]],[],["loc",[null,[4,6],[4,31]]]]
            ],
            locals: [],
            templates: []
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.3",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 6,
                "column": 2
              }
            },
            "moduleName": "icarus/templates/components/liquid-versions.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","liquid-child",[],["version",["subexpr","@mut",[["get","version",["loc",[null,[3,28],[3,35]]]]],[],[]],"didRender","childDidRender","class",["subexpr","@mut",[["get","class",["loc",[null,[3,69],[3,74]]]]],[],[]]],0,null,["loc",[null,[3,4],[5,21]]]]
          ],
          locals: [],
          templates: [child0]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 7,
              "column": 0
            }
          },
          "moduleName": "icarus/templates/components/liquid-versions.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","if",[["get","version.shouldRender",["loc",[null,[2,8],[2,28]]]]],[],0,null,["loc",[null,[2,2],[6,9]]]]
        ],
        locals: ["version"],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 8,
            "column": 0
          }
        },
        "moduleName": "icarus/templates/components/liquid-versions.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","each",[["get","versions",["loc",[null,[1,8],[1,16]]]]],["key","guid"],0,null,["loc",[null,[1,0],[7,9]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('icarus/templates/components/liquid-with', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@1.13.3",
            "loc": {
              "source": null,
              "start": {
                "line": 2,
                "column": 2
              },
              "end": {
                "line": 4,
                "column": 2
              }
            },
            "moduleName": "icarus/templates/components/liquid-with.hbs"
          },
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["inline","yield",[["get","version",["loc",[null,[3,13],[3,20]]]]],[],["loc",[null,[3,4],[3,24]]]]
          ],
          locals: ["version"],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 1,
              "column": 0
            },
            "end": {
              "line": 5,
              "column": 0
            }
          },
          "moduleName": "icarus/templates/components/liquid-with.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-versions",[],["value",["subexpr","@mut",[["get","attrs.value",["loc",[null,[2,28],[2,39]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[2,44],[2,47]]]]],[],[]],"name",["subexpr","@mut",[["get","name",["loc",[null,[2,53],[2,57]]]]],[],[]],"class",["subexpr","@mut",[["get","class",["loc",[null,[2,64],[2,69]]]]],[],[]]],0,null,["loc",[null,[2,2],[4,23]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            meta: {
              "revision": "Ember@1.13.3",
              "loc": {
                "source": null,
                "start": {
                  "line": 14,
                  "column": 4
                },
                "end": {
                  "line": 16,
                  "column": 4
                }
              },
              "moduleName": "icarus/templates/components/liquid-with.hbs"
            },
            arity: 1,
            cachedFragment: null,
            hasRendered: false,
            buildFragment: function buildFragment(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
              var morphs = new Array(1);
              morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, 0);
              dom.insertBoundary(fragment, null);
              return morphs;
            },
            statements: [
              ["inline","yield",[["get","version",["loc",[null,[15,15],[15,22]]]]],[],["loc",[null,[15,6],[15,26]]]]
            ],
            locals: ["version"],
            templates: []
          };
        }());
        return {
          meta: {
            "revision": "Ember@1.13.3",
            "loc": {
              "source": null,
              "start": {
                "line": 6,
                "column": 2
              },
              "end": {
                "line": 17,
                "column": 2
              }
            },
            "moduleName": "icarus/templates/components/liquid-with.hbs"
          },
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["block","liquid-versions",[],["value",["subexpr","@mut",[["get","attrs.value",["loc",[null,[14,30],[14,41]]]]],[],[]],"notify",["subexpr","@mut",[["get","container",["loc",[null,[14,49],[14,58]]]]],[],[]],"use",["subexpr","@mut",[["get","use",["loc",[null,[14,63],[14,66]]]]],[],[]],"name",["subexpr","@mut",[["get","name",["loc",[null,[14,72],[14,76]]]]],[],[]]],0,null,["loc",[null,[14,4],[16,25]]]]
          ],
          locals: ["container"],
          templates: [child0]
        };
      }());
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 0
            },
            "end": {
              "line": 18,
              "column": 0
            }
          },
          "moduleName": "icarus/templates/components/liquid-with.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, 0);
          dom.insertBoundary(fragment, null);
          return morphs;
        },
        statements: [
          ["block","liquid-container",[],["id",["subexpr","@mut",[["get","id",["loc",[null,[7,9],[7,11]]]]],[],[]],"class",["subexpr","@mut",[["get","class",["loc",[null,[8,12],[8,17]]]]],[],[]],"growDuration",["subexpr","@mut",[["get","growDuration",["loc",[null,[9,19],[9,31]]]]],[],[]],"growPixelsPerSecond",["subexpr","@mut",[["get","growPixelsPerSecond",["loc",[null,[10,26],[10,45]]]]],[],[]],"growEasing",["subexpr","@mut",[["get","growEasing",["loc",[null,[11,17],[11,27]]]]],[],[]],"enableGrowth",["subexpr","@mut",[["get","enableGrowth",["loc",[null,[12,19],[12,31]]]]],[],[]]],0,null,["loc",[null,[6,2],[17,23]]]]
        ],
        locals: [],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 19,
            "column": 0
          }
        },
        "moduleName": "icarus/templates/components/liquid-with.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","if",[["get","containerless",["loc",[null,[1,6],[1,19]]]]],[],0,1,["loc",[null,[1,0],[18,7]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('icarus/templates/components/voting-arrows', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "icarus/templates/components/voting-arrows.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("i");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var morphs = new Array(2);
        morphs[0] = dom.createAttrMorph(element0, 'class');
        morphs[1] = dom.createElementMorph(element0);
        return morphs;
      },
      statements: [
        ["attribute","class",["concat",["arrow fa fa-arrow-up ",["subexpr","if",[["get","isUpvoted",["loc",[null,[1,36],[1,45]]]],"active"],[],["loc",[null,[1,31],[1,56]]]]]]],
        ["element","action",["vote"],[],["loc",[null,[1,58],[1,75]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('icarus/templates/components/voting-score', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 3,
            "column": 0
          }
        },
        "moduleName": "icarus/templates/components/voting-score.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("span");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("br");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\nScore\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]),0,0);
        return morphs;
      },
      statements: [
        ["content","score",["loc",[null,[1,6],[1,15]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('icarus/templates/index', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@1.13.3",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 2
            },
            "end": {
              "line": 4,
              "column": 2
            }
          },
          "moduleName": "icarus/templates/index.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["inline","event-list-item",[],["event",["subexpr","@mut",[["get","talk",["loc",[null,[3,28],[3,32]]]]],[],[]]],["loc",[null,[3,4],[3,34]]]]
        ],
        locals: ["talk"],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 6,
            "column": 0
          }
        },
        "moduleName": "icarus/templates/index.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","container");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        return morphs;
      },
      statements: [
        ["block","each",[["get","model",["loc",[null,[2,10],[2,15]]]]],[],0,null,["loc",[null,[2,2],[4,11]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('icarus/templates/talk', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 21,
            "column": 0
          }
        },
        "moduleName": "icarus/templates/talk.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","container");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","card");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","header");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("h1");
        dom.setAttribute(el4,"class","title");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createTextNode("\n      Nulla ultricies finibus felis vitae vestibulum. Ut quis purus auctor, eleifend erat sed, rhoncus enim. Vivamus varius odio ut mollis vehicula. Pellentesque nibh lorem, tristique eu ultrices eu, dignissim sed purus. Vestibulum sagittis dolor ac lectus pharetra, eu congue nunc sollicitudin. Phasellus ornare ex at libero dapibus, eu gravida metus ullamcorper. Mauris feugiat venenatis augue, in lobortis turpis accumsan sed. Ut suscipit dignissim libero non placerat. Praesent id est in sapien pulvinar porta vel bibendum ipsum.\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createTextNode("\n      Praesent molestie efficitur auctor. In eleifend est a nulla consequat viverra. Cras viverra finibus nisi, eget eleifend justo tempus in. In pretium massa nec interdum rutrum. Phasellus porta pharetra ullamcorper. Sed viverra tempor venenatis. Curabitur blandit finibus lobortis. Praesent varius auctor erat, sed placerat neque cursus ut. Vivamus interdum arcu sed turpis laoreet mattis. Nullam tempus mattis mi, ut sagittis velit aliquet et. Phasellus dictum non risus vulputate auctor. Sed consequat mollis ultrices. Nulla quis tristique erat. Quisque fringilla tellus eu arcu commodo, nec vulputate ante cursus. Phasellus non lacus nec risus bibendum bibendum ut sit amet massa. Etiam eu mattis neque.\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0, 1]);
        var element1 = dom.childAt(element0, [1]);
        var element2 = dom.childAt(element1, [3]);
        var morphs = new Array(5);
        morphs[0] = dom.createAttrMorph(element0, 'data-container-id');
        morphs[1] = dom.createMorphAt(element1,1,1);
        morphs[2] = dom.createAttrMorph(element2, 'data-title-id');
        morphs[3] = dom.createMorphAt(element2,0,0);
        morphs[4] = dom.createMorphAt(element1,5,5);
        return morphs;
      },
      statements: [
        ["attribute","data-container-id",["concat",[["get","model.id",["loc",[null,[2,41],[2,49]]]]]]],
        ["inline","voting-arrows",[],["lid",["subexpr","@mut",[["get","model.id",["loc",[null,[5,14],[5,22]]]]],[],[]],"isUpvoted",["subexpr","@mut",[["get","model.isUpvoted",["loc",[null,[6,20],[6,35]]]]],[],[]],"upvoteAction","upvote"],["loc",[null,[4,6],[7,33]]]],
        ["attribute","data-title-id",["get","model.id",["loc",[null,[8,26],[8,34]]]]],
        ["content","model.title",["loc",[null,[8,51],[8,66]]]],
        ["inline","voting-score",[],["score",["subexpr","@mut",[["get","model.votes.length",["loc",[null,[9,27],[9,45]]]]],[],[]],"lid",["subexpr","@mut",[["get","model.id",["loc",[null,[9,50],[9,58]]]]],[],[]]],["loc",[null,[9,6],[9,60]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('icarus/templates/workshops', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@1.13.3",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 2,
            "column": 0
          }
        },
        "moduleName": "icarus/templates/workshops.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        return morphs;
      },
      statements: [
        ["content","outlet",["loc",[null,[1,0],[1,10]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('icarus/tests/adapters/application.jshint', function () {

  'use strict';

  module('JSHint - adapters');
  test('adapters/application.js should pass jshint', function() { 
    ok(true, 'adapters/application.js should pass jshint.'); 
  });

});
define('icarus/tests/app.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('app.js should pass jshint', function() { 
    ok(true, 'app.js should pass jshint.'); 
  });

});
define('icarus/tests/components/event-list-item.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/event-list-item.js should pass jshint', function() { 
    ok(true, 'components/event-list-item.js should pass jshint.'); 
  });

});
define('icarus/tests/components/voting-arrows.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/voting-arrows.js should pass jshint', function() { 
    ok(true, 'components/voting-arrows.js should pass jshint.'); 
  });

});
define('icarus/tests/components/voting-score.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/voting-score.js should pass jshint', function() { 
    ok(true, 'components/voting-score.js should pass jshint.'); 
  });

});
define('icarus/tests/controllers/application.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/application.js should pass jshint', function() { 
    ok(true, 'controllers/application.js should pass jshint.'); 
  });

});
define('icarus/tests/controllers/talk.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/talk.js should pass jshint', function() { 
    ok(true, 'controllers/talk.js should pass jshint.'); 
  });

});
define('icarus/tests/helpers/resolver', ['exports', 'ember/resolver', 'icarus/config/environment'], function (exports, Resolver, config) {

  'use strict';

  var resolver = Resolver['default'].create();

  resolver.namespace = {
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix
  };

  exports['default'] = resolver;

});
define('icarus/tests/helpers/resolver.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/resolver.js should pass jshint', function() { 
    ok(true, 'helpers/resolver.js should pass jshint.'); 
  });

});
define('icarus/tests/helpers/start-app', ['exports', 'ember', 'icarus/app', 'icarus/config/environment'], function (exports, Ember, Application, config) {

  'use strict';



  exports['default'] = startApp;
  function startApp(attrs) {
    var application;

    var attributes = Ember['default'].merge({}, config['default'].APP);
    attributes = Ember['default'].merge(attributes, attrs); // use defaults, but you can override;

    Ember['default'].run(function () {
      application = Application['default'].create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }

});
define('icarus/tests/helpers/start-app.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/start-app.js should pass jshint', function() { 
    ok(true, 'helpers/start-app.js should pass jshint.'); 
  });

});
define('icarus/tests/instance-initializers/track-pageviews.jshint', function () {

  'use strict';

  module('JSHint - instance-initializers');
  test('instance-initializers/track-pageviews.js should pass jshint', function() { 
    ok(true, 'instance-initializers/track-pageviews.js should pass jshint.'); 
  });

});
define('icarus/tests/models/talk.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/talk.js should pass jshint', function() { 
    ok(true, 'models/talk.js should pass jshint.'); 
  });

});
define('icarus/tests/models/user.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/user.js should pass jshint', function() { 
    ok(true, 'models/user.js should pass jshint.'); 
  });

});
define('icarus/tests/models/vote.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/vote.js should pass jshint', function() { 
    ok(true, 'models/vote.js should pass jshint.'); 
  });

});
define('icarus/tests/router.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('router.js should pass jshint', function() { 
    ok(true, 'router.js should pass jshint.'); 
  });

});
define('icarus/tests/routes/application.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/application.js should pass jshint', function() { 
    ok(true, 'routes/application.js should pass jshint.'); 
  });

});
define('icarus/tests/routes/index.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/index.js should pass jshint', function() { 
    ok(true, 'routes/index.js should pass jshint.'); 
  });

});
define('icarus/tests/routes/talk.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/talk.js should pass jshint', function() { 
    ok(true, 'routes/talk.js should pass jshint.'); 
  });

});
define('icarus/tests/routes/talks.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/talks.js should pass jshint', function() { 
    ok(true, 'routes/talks.js should pass jshint.'); 
  });

});
define('icarus/tests/routes/workshops.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/workshops.js should pass jshint', function() { 
    ok(true, 'routes/workshops.js should pass jshint.'); 
  });

});
define('icarus/tests/services/session.jshint', function () {

  'use strict';

  module('JSHint - services');
  test('services/session.js should pass jshint', function() { 
    ok(true, 'services/session.js should pass jshint.'); 
  });

});
define('icarus/tests/services/track.jshint', function () {

  'use strict';

  module('JSHint - services');
  test('services/track.js should pass jshint', function() { 
    ok(true, 'services/track.js should pass jshint.'); 
  });

});
define('icarus/tests/test-helper', ['icarus/tests/helpers/resolver', 'ember-qunit'], function (resolver, ember_qunit) {

	'use strict';

	ember_qunit.setResolver(resolver['default']);

});
define('icarus/tests/test-helper.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('test-helper.js should pass jshint', function() { 
    ok(true, 'test-helper.js should pass jshint.'); 
  });

});
define('icarus/tests/transitions.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('transitions.js should pass jshint', function() { 
    ok(true, 'transitions.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/adapters/application-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('adapter:application', 'ApplicationAdapter', {});

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var adapter = this.subject();
    assert.ok(adapter);
  });

  // Specify the other units that are required for this test.
  // needs: ['serializer:foo']

});
define('icarus/tests/unit/adapters/application-test.jshint', function () {

  'use strict';

  module('JSHint - unit/adapters');
  test('unit/adapters/application-test.js should pass jshint', function() { 
    ok(true, 'unit/adapters/application-test.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/components/event-list-item', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent('event-list-item', {});

  ember_qunit.test('it renders', function (assert) {
    assert.expect(2);

    // Creates the component instance
    var component = this.subject();
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');
  });

  // Specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']

});
define('icarus/tests/unit/components/event-list-item.jshint', function () {

  'use strict';

  module('JSHint - unit/components');
  test('unit/components/event-list-item.js should pass jshint', function() { 
    ok(true, 'unit/components/event-list-item.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/components/voting-arrows-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent('voting-arrows', {});

  ember_qunit.test('it renders', function (assert) {
    assert.expect(2);

    // Creates the component instance
    var component = this.subject();
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');
  });

  // Specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']

});
define('icarus/tests/unit/components/voting-arrows-test.jshint', function () {

  'use strict';

  module('JSHint - unit/components');
  test('unit/components/voting-arrows-test.js should pass jshint', function() { 
    ok(true, 'unit/components/voting-arrows-test.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/components/voting-score-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent('voting-score', {});

  ember_qunit.test('it renders', function (assert) {
    assert.expect(2);

    // Creates the component instance
    var component = this.subject();
    assert.equal(component._state, 'preRender');

    // Renders the component to the page
    this.render();
    assert.equal(component._state, 'inDOM');
  });

  // Specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']

});
define('icarus/tests/unit/components/voting-score-test.jshint', function () {

  'use strict';

  module('JSHint - unit/components');
  test('unit/components/voting-score-test.js should pass jshint', function() { 
    ok(true, 'unit/components/voting-score-test.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/controllers/application-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:application', {});

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('icarus/tests/unit/controllers/application-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers');
  test('unit/controllers/application-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/application-test.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/controllers/talk-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:talk', {});

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('icarus/tests/unit/controllers/talk-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers');
  test('unit/controllers/talk-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/talk-test.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/models/talk-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('talk', 'Unit | Model | talk', {
    // Specify the other units that are required for this test.
    needs: ['model:vote', 'model:user']
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('icarus/tests/unit/models/talk-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/talk-test.js should pass jshint', function() { 
    ok(true, 'unit/models/talk-test.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/models/user-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('user', 'Unit | Model | user', {
    // Specify the other units that are required for this test.
    needs: ['model:vote', 'model:talk']
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('icarus/tests/unit/models/user-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/user-test.js should pass jshint', function() { 
    ok(true, 'unit/models/user-test.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/models/vote-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('vote', 'Unit | Model | vote', {
    // Specify the other units that are required for this test.
    needs: ['model:user', 'model:talk']
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('icarus/tests/unit/models/vote-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/vote-test.js should pass jshint', function() { 
    ok(true, 'unit/models/vote-test.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/routes/application-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:application', {});

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('icarus/tests/unit/routes/application-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/application-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/application-test.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/routes/talks-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:talks', {});

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('icarus/tests/unit/routes/talks-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/talks-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/talks-test.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/routes/workshops-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:workshops', {});

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('icarus/tests/unit/routes/workshops-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/workshops-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/workshops-test.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/services/session-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('service:session', 'Unit | Service | session', {});

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var firebaseMock = {
      onAuth: function onAuth() {
        return true;
      }
    };

    var service = this.subject({
      firebase: firebaseMock
    });
    assert.ok(service);
  });

  // Specify the other units that are required for this test.
  // needs: ['service:foo']

});
define('icarus/tests/unit/services/session-test.jshint', function () {

  'use strict';

  module('JSHint - unit/services');
  test('unit/services/session-test.js should pass jshint', function() { 
    ok(true, 'unit/services/session-test.js should pass jshint.'); 
  });

});
define('icarus/tests/unit/services/track-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('service:track', {});

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var service = this.subject();
    assert.ok(service);
  });

  // Specify the other units that are required for this test.
  // needs: ['service:foo']

});
define('icarus/tests/unit/services/track-test.jshint', function () {

  'use strict';

  module('JSHint - unit/services');
  test('unit/services/track-test.js should pass jshint', function() { 
    ok(true, 'unit/services/track-test.js should pass jshint.'); 
  });

});
define('icarus/torii-providers/firebase', ['exports', 'emberfire/torii-providers/firebase'], function (exports, FirebaseProvider) {

	'use strict';

	exports['default'] = FirebaseProvider['default'];

});
define('icarus/transitions', ['exports'], function (exports) {

  'use strict';

  // Define transitions for Liquid-Fire
  // http://ef4.github.io/liquid-fire/#/

  var duration = 400;

  exports['default'] = function () {

    // Transition from index to a single talk
    this.transition(this.fromRoute('index'), this.toRoute('talk'), this.useAndReverse('explode', {
      matchBy: 'data-score-id',
      use: ['fly-to', { duration: duration }]
    }, {
      matchBy: 'data-voting-id',
      use: ['fly-to', { duration: duration }]
    }, {
      matchBy: 'data-title-id',
      use: ['fly-to', { duration: duration }]
    }, {
      pickOld: '.event-list-item',
      matchBy: 'data-container-id',
      use: ['fly-to', { duration: duration, movingSide: 'new' }]
    }, {
      pickNew: '.card',
      matchBy: 'data-container-id',
      use: ['fly-to', { duration: duration, movingSide: 'new' }]
    }, {
      pickOld: '.container > .event-list-item',
      use: ['fade']
    }));
  }

});
define('icarus/transitions/cross-fade', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';


  exports['default'] = crossFade;
  // BEGIN-SNIPPET cross-fade-definition
  function crossFade() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    liquid_fire.stop(this.oldElement);
    return liquid_fire.Promise.all([liquid_fire.animate(this.oldElement, { opacity: 0 }, opts), liquid_fire.animate(this.newElement, { opacity: [opts.maxOpacity || 1, 0] }, opts)]);
  } // END-SNIPPET

});
define('icarus/transitions/default', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';


  exports['default'] = defaultTransition;
  function defaultTransition() {
    if (this.newElement) {
      this.newElement.css({ visibility: "" });
    }
    return liquid_fire.Promise.resolve();
  }

});
define('icarus/transitions/explode', ['exports', 'ember', 'liquid-fire'], function (exports, Ember, liquid_fire) {

  'use strict';



  exports['default'] = explode;

  function explode() {
    var _this = this;

    var seenElements = {};
    var sawBackgroundPiece = false;

    for (var _len = arguments.length, pieces = Array(_len), _key = 0; _key < _len; _key++) {
      pieces[_key] = arguments[_key];
    }

    var promises = pieces.map(function (piece) {
      if (piece.matchBy) {
        return matchAndExplode(_this, piece, seenElements);
      } else if (piece.pick || piece.pickOld || piece.pickNew) {
        return explodePiece(_this, piece, seenElements);
      } else {
        sawBackgroundPiece = true;
        return runAnimation(_this, piece);
      }
    });
    if (!sawBackgroundPiece) {
      if (this.newElement) {
        this.newElement.css({ visibility: "" });
      }
      if (this.oldElement) {
        this.oldElement.css({ visibility: "hidden" });
      }
    }
    return liquid_fire.Promise.all(promises);
  }

  function explodePiece(context, piece, seen) {
    var childContext = Ember['default'].copy(context);
    var selectors = [piece.pickOld || piece.pick, piece.pickNew || piece.pick];
    var cleanupOld, cleanupNew;

    if (selectors[0] || selectors[1]) {
      cleanupOld = _explodePart(context, "oldElement", childContext, selectors[0], seen);
      cleanupNew = _explodePart(context, "newElement", childContext, selectors[1], seen);
      if (!cleanupOld && !cleanupNew) {
        return liquid_fire.Promise.resolve();
      }
    }

    return runAnimation(childContext, piece)["finally"](function () {
      if (cleanupOld) {
        cleanupOld();
      }
      if (cleanupNew) {
        cleanupNew();
      }
    });
  }

  function _explodePart(context, field, childContext, selector, seen) {
    var child, childOffset, width, height, newChild;
    var elt = context[field];

    childContext[field] = null;
    if (elt && selector) {
      child = elt.find(selector).filter(function () {
        var guid = Ember['default'].guidFor(this);
        if (!seen[guid]) {
          seen[guid] = true;
          return true;
        }
      });
      if (child.length > 0) {
        childOffset = child.offset();
        width = child.outerWidth();
        height = child.outerHeight();
        newChild = child.clone();

        // Hide the original element
        child.css({ visibility: "hidden" });

        // If the original element's parent was hidden, hide our clone
        // too.
        if (elt.css("visibility") === "hidden") {
          newChild.css({ visibility: "hidden" });
        }
        newChild.appendTo(elt.parent());
        newChild.outerWidth(width);
        newChild.outerHeight(height);
        var newParentOffset = newChild.offsetParent().offset();
        newChild.css({
          position: "absolute",
          top: childOffset.top - newParentOffset.top,
          left: childOffset.left - newParentOffset.left,
          margin: 0
        });

        // Pass the clone to the next animation
        childContext[field] = newChild;
        return function cleanup() {
          newChild.remove();
          child.css({ visibility: "" });
        };
      }
    }
  }

  function animationFor(context, piece) {
    var name, args, func;
    if (!piece.use) {
      throw new Error("every argument to the 'explode' animation must include a followup animation to 'use'");
    }
    if (Ember['default'].isArray(piece.use)) {
      name = piece.use[0];
      args = piece.use.slice(1);
    } else {
      name = piece.use;
      args = [];
    }
    if (typeof name === "function") {
      func = name;
    } else {
      func = context.lookup(name);
    }
    return function () {
      return liquid_fire.Promise.resolve(func.apply(this, args));
    };
  }

  function runAnimation(context, piece) {
    return new liquid_fire.Promise(function (resolve, reject) {
      animationFor(context, piece).apply(context).then(resolve, reject);
    });
  }

  function matchAndExplode(context, piece, seen) {
    if (!context.oldElement || !context.newElement) {
      return liquid_fire.Promise.resolve();
    }

    // reduce the matchBy scope
    if (piece.pick) {
      context.oldElement = context.oldElement.find(piece.pick);
      context.newElement = context.newElement.find(piece.pick);
    }

    if (piece.pickOld) {
      context.oldElement = context.oldElement.find(piece.pickOld);
    }

    if (piece.pickNew) {
      context.newElement = context.newElement.find(piece.pickNew);
    }

    // use the fastest selector available
    var selector;

    if (piece.matchBy === "id") {
      selector = function (attrValue) {
        return "#" + attrValue;
      };
    } else if (piece.matchBy === "class") {
      selector = function (attrValue) {
        return "." + attrValue;
      };
    } else {
      selector = function (attrValue) {
        var escapedAttrValue = attrValue.replace(/'/g, "\\'");
        return "[" + piece.matchBy + "='" + escapedAttrValue + "']";
      };
    }

    var hits = Ember['default'].A(context.oldElement.find("[" + piece.matchBy + "]").toArray());
    return liquid_fire.Promise.all(hits.map(function (elt) {
      var attrValue = Ember['default'].$(elt).attr(piece.matchBy);

      // if there is no match for a particular item just skip it
      if (attrValue === "" || context.newElement.find(selector(attrValue)).length === 0) {
        return liquid_fire.Promise.resolve();
      }

      return explodePiece(context, {
        pick: selector(attrValue),
        use: piece.use
      }, seen);
    }));
  }

});
define('icarus/transitions/fade', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';


  exports['default'] = fade;

  // BEGIN-SNIPPET fade-definition
  function fade() {
    var _this = this;

    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var firstStep;
    var outOpts = opts;
    var fadingElement = findFadingElement(this);

    if (fadingElement) {
      // We still have some older version that is in the process of
      // fading out, so out first step is waiting for it to finish.
      firstStep = liquid_fire.finish(fadingElement, 'fade-out');
    } else {
      if (liquid_fire.isAnimating(this.oldElement, 'fade-in')) {
        // if the previous view is partially faded in, scale its
        // fade-out duration appropriately.
        outOpts = { duration: liquid_fire.timeSpent(this.oldElement, 'fade-in') };
      }
      liquid_fire.stop(this.oldElement);
      firstStep = liquid_fire.animate(this.oldElement, { opacity: 0 }, outOpts, 'fade-out');
    }
    return firstStep.then(function () {
      return liquid_fire.animate(_this.newElement, { opacity: [opts.maxOpacity || 1, 0] }, opts, 'fade-in');
    });
  }

  function findFadingElement(context) {
    for (var i = 0; i < context.older.length; i++) {
      var entry = context.older[i];
      if (liquid_fire.isAnimating(entry.element, 'fade-out')) {
        return entry.element;
      }
    }
    if (liquid_fire.isAnimating(context.oldElement, 'fade-out')) {
      return context.oldElement;
    }
  }
  // END-SNIPPET

});
define('icarus/transitions/flex-grow', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';


  exports['default'] = flexGrow;
  function flexGrow(opts) {
    liquid_fire.stop(this.oldElement);
    return liquid_fire.Promise.all([liquid_fire.animate(this.oldElement, { 'flex-grow': 0 }, opts), liquid_fire.animate(this.newElement, { 'flex-grow': [1, 0] }, opts)]);
  }

});
define('icarus/transitions/fly-to', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';



  exports['default'] = flyTo;
  function flyTo() {
    var _this = this;

    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    if (!this.newElement) {
      return liquid_fire.Promise.resolve();
    } else if (!this.oldElement) {
      this.newElement.css({ visibility: '' });
      return liquid_fire.Promise.resolve();
    }

    var oldOffset = this.oldElement.offset();
    var newOffset = this.newElement.offset();

    if (opts.movingSide === 'new') {
      var motion = {
        translateX: [0, oldOffset.left - newOffset.left],
        translateY: [0, oldOffset.top - newOffset.top],
        outerWidth: [this.newElement.outerWidth(), this.oldElement.outerWidth()],
        outerHeight: [this.newElement.outerHeight(), this.oldElement.outerHeight()]
      };
      this.oldElement.css({ visibility: 'hidden' });
      return liquid_fire.animate(this.newElement, motion, opts);
    } else {
      var motion = {
        translateX: newOffset.left - oldOffset.left,
        translateY: newOffset.top - oldOffset.top,
        outerWidth: this.newElement.outerWidth(),
        outerHeight: this.newElement.outerHeight()
      };
      this.newElement.css({ visibility: 'hidden' });
      return liquid_fire.animate(this.oldElement, motion, opts).then(function () {
        _this.newElement.css({ visibility: '' });
      });
    }
  }

});
define('icarus/transitions/move-over', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';



  exports['default'] = moveOver;

  function moveOver(dimension, direction, opts) {
    var _this = this;

    var oldParams = {},
        newParams = {},
        firstStep,
        property,
        measure;

    if (dimension.toLowerCase() === 'x') {
      property = 'translateX';
      measure = 'width';
    } else {
      property = 'translateY';
      measure = 'height';
    }

    if (liquid_fire.isAnimating(this.oldElement, 'moving-in')) {
      firstStep = liquid_fire.finish(this.oldElement, 'moving-in');
    } else {
      liquid_fire.stop(this.oldElement);
      firstStep = liquid_fire.Promise.resolve();
    }

    return firstStep.then(function () {
      var bigger = biggestSize(_this, measure);
      oldParams[property] = bigger * direction + 'px';
      newParams[property] = ['0px', -1 * bigger * direction + 'px'];

      return liquid_fire.Promise.all([liquid_fire.animate(_this.oldElement, oldParams, opts), liquid_fire.animate(_this.newElement, newParams, opts, 'moving-in')]);
    });
  }

  function biggestSize(context, dimension) {
    var sizes = [];
    if (context.newElement) {
      sizes.push(parseInt(context.newElement.css(dimension), 10));
      sizes.push(parseInt(context.newElement.parent().css(dimension), 10));
    }
    if (context.oldElement) {
      sizes.push(parseInt(context.oldElement.css(dimension), 10));
      sizes.push(parseInt(context.oldElement.parent().css(dimension), 10));
    }
    return Math.max.apply(null, sizes);
  }

});
define('icarus/transitions/scale', ['exports', 'liquid-fire'], function (exports, liquid_fire) {

  'use strict';



  exports['default'] = scale;
  function scale() {
    var _this = this;

    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    return liquid_fire.animate(this.oldElement, { scale: [0.2, 1] }, opts).then(function () {
      return liquid_fire.animate(_this.newElement, { scale: [1, 0.2] }, opts);
    });
  }

});
define('icarus/transitions/scroll-then', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = function (nextTransitionName, options) {
    for (var _len = arguments.length, rest = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      rest[_key - 2] = arguments[_key];
    }

    var _this = this;

    Ember['default'].assert('You must provide a transition name as the first argument to scrollThen. Example: this.use(\'scrollThen\', \'toLeft\')', 'string' === typeof nextTransitionName);

    var el = document.getElementsByTagName('html');
    var nextTransition = this.lookup(nextTransitionName);
    if (!options) {
      options = {};
    }

    Ember['default'].assert('The second argument to scrollThen is passed to Velocity\'s scroll function and must be an object', 'object' === typeof options);

    // set scroll options via: this.use('scrollThen', 'ToLeft', {easing: 'spring'})
    options = Ember['default'].merge({ duration: 500, offset: 0 }, options);

    // additional args can be passed through after the scroll options object
    // like so: this.use('scrollThen', 'moveOver', {duration: 100}, 'x', -1);

    return window.$.Velocity(el, 'scroll', options).then(function () {
      nextTransition.apply(_this, rest);
    });
  }

});
define('icarus/transitions/to-down', ['exports', 'icarus/transitions/move-over'], function (exports, moveOver) {

  'use strict';

  exports['default'] = function (opts) {
    return moveOver['default'].call(this, "y", 1, opts);
  }

});
define('icarus/transitions/to-left', ['exports', 'icarus/transitions/move-over'], function (exports, moveOver) {

  'use strict';

  exports['default'] = function (opts) {
    return moveOver['default'].call(this, "x", -1, opts);
  }

});
define('icarus/transitions/to-right', ['exports', 'icarus/transitions/move-over'], function (exports, moveOver) {

  'use strict';

  exports['default'] = function (opts) {
    return moveOver['default'].call(this, "x", 1, opts);
  }

});
define('icarus/transitions/to-up', ['exports', 'icarus/transitions/move-over'], function (exports, moveOver) {

  'use strict';

  exports['default'] = function (opts) {
    return moveOver['default'].call(this, "y", -1, opts);
  }

});
/* jshint ignore:start */

/* jshint ignore:end */

/* jshint ignore:start */

define('icarus/config/environment', ['ember'], function(Ember) {
  var prefix = 'icarus';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (runningTests) {
  require("icarus/tests/test-helper");
} else {
  require("icarus/app")["default"].create({"name":"icarus","version":"0.0.0+5b9b5342"});
}

/* jshint ignore:end */
//# sourceMappingURL=icarus.map