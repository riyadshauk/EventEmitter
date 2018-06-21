I coded this up from scratch as a coding exercise.

I basically just implemented this EventEmitter module, as described in the official node.js documentation ([https://nodejs.org/dist/latest-v10.x/docs/api/events.html](https://nodejs.org/dist/latest-v10.x/docs/api/events.html)).

I decided to do this task in ES6 TypeScript (superset of ES6 JavaScript), which transpiles down to JavaScript.

I used TDD to develop this module.

Run `$npm test` to see the 46 passing test-cases (using [Mocha](https://mochajs.org/) with [Chai](http://www.chaijs.com/) and [Sinon](http://sinonjs.org/) for testing and using spies / stubbing, when appropriate).