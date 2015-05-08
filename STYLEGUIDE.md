# Style Guide

This project is meant to be a playground for trying out future Ember features and JavaScript ES6 (ES 2015) features.  As such, we'll be using the most modern features available, and pull requests will be rejected for not following the style guide.  As a general reference, see [Babel's documentation about ES6](http://babeljs.io/docs/learn-es6/).  I will demonstrate some of those features here, as well as list out other style preferences.

Unfortunately, there is no way to programmatically check for these styles, but that's what the code review process is for!

## General Syntax

- No trailing white space
- 2-space tabs
- Always use `''` around strings instead of `""`

## Ember-Specific Style

- Don't use the boolean interpretation of a variable in a situation where you want to determine if something is present.  Instead, use Ember's helper methods that do the same

    ```js
    // BAD
    if (object.property) {
      console.log(object.property):
    }

    // GOOD
    if (Ember.isPresent(object.property)) {
      console.log(object.property):
    }
    ```

## ES6 Style Features

- Do not make aliases for `this` when the context changes.  Instead, use a "fat arrow" function

    ```js
    // BAD
    const _this = this;
    return new Ember.RSVP.Promise(function(resolve) {
      const name = _this.get('name');
      resolve(name);
    });

    // GOOD
    return new Ember.RSVP.Promise((resolve) => {
      const name = this.get('name');
      resolve(name);
    });
    ```

- Always use `const` instead of `var` for variables that will never change value (immutable)
- Always use `let` instead of `var` for variables that will change value (mutable)
- Always use the "shortcut" for defining a method on an object

    ```js
    // BAD
    class Person {
      greet: function() {
        return 'Hello, friend!';
      }
    }

    // GOOD
    class Person {
      greet() {
        return 'Hello, friend!';
      }
    }
    ```
- Always use template strings instead of concatination

    ```js
    // BAD
    const firstName = 'Alex';
    const lastName = 'LaFroscia'
    const fullName = firstName + " " + lastName;

    // GOOD
    const firstName = 'Alex';
    const lastName = 'LaFroscia'
    const fullName = `${firstName} ${lastName}`;
    ```

