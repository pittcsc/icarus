# Icarus

[![Build Status](https://travis-ci.org/Pitt-CSC/icarus.svg?branch=master)](https://travis-ci.org/Pitt-CSC/icarus)

Web browser client for the Icarus project of the Pitt Computer Science Club

## Prerequisites

You will need the following things properly installed on your computer.

**Programs**

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) (with NPM)
* [Bower](http://bower.io/)
* [Ember CLI](http://www.ember-cli.com/)
* [PhantomJS](http://phantomjs.org/)

**Projects**

* [Icarus Backend](https://github.com/Pitt-CSC/icarus-backend)

## Installation

1. If you're contributing, fork the repo
2. `git clone <repository-url>` the repository
3. change into the new directory
4. `npm install`
5. `bower install`

## Contributing

We would love to have your help with the project!  If you have ideas for new features, feel free to make an issue here on Github so we can plan things out, and then fork the repo and get to work!  Pull requests with updates and fixes are welcome as well!

Some notes about pull requests: please follow [our styleguide](https://github.com/Pitt-CSC/icarus/blob/master/STYLEGUIDE.md) for information about the code style of the project and what our expectations are.  Contributed code will also not be accepted without tests!

### Ember Commands to Know

* `ember server`
    * Visit your app at [http://localhost:4200](http://localhost:4200).
* `ember test`
    * Runs the test suite in the terminal through Phantom.js
    * Can be run in the browser using `ember test --serve`
* `ember generate __type__ __name__`
    * Generate new files in the project
    * _Always_ use the generators, don't make new files by hand!

### Configuration

#### Mixpanel Tracking

If you want Mixpanel tracking to work in development, just set an environment variable of `ICARUS_MIXPANEL_TOKEN` like so:

```bash
export ICARUS_MIXPANEL_TOKEN=__some_mixpanel_token__
```

If the token is not present, tracking will just be ignored.

## Further Reading / Useful Links

* [ember.js](http://emberjs.com/)
* [ember-cli](http://www.ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)

