import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import EventEmitter from './EventEmitter';
import { OnceWrapper } from './EETypes';

describe('EventEmitter (EE) Test Suite', () => {
  let myEmitter: EventEmitter;
  let count: number;
  const incrementer = (): number => count++;
  const incrementer2 = (): number => count++;
  const incrementer3 = (obj: { count: number }, incrementBy: number): number => obj.count += incrementBy;
  beforeEach(() => {
    myEmitter = new EventEmitter;
    count = 0;
  });
  describe('static listenerCount', () => {
    it('correctly calls (spied on) .listenerCount with provided arguments', () => {
      const emitSpy = sinon.spy(myEmitter, 'listenerCount');
      const num = EventEmitter.listenerCount(myEmitter, 'hello');
      expect(emitSpy.callCount).to.equal(1);
      expect(emitSpy.calledWithExactly('hello')).to.be.true;
      expect(num).to.equal(0);
    });
  });
  describe('static defaultMaxListeners', () => {
    it('correctly returns a default max-listener number (ie 10)', () => {
      const num = EventEmitter.defaultMaxListeners;
      expect(num).to.equal(10);
    });
  });
  describe('addListener', () => {
    it('correctly calls (stubbed out) this.on once', () => {
      const on = sinon.stub(myEmitter, 'on');
      myEmitter.on('test-further-in-on', incrementer);
      expect(on.callCount).to.equal(1);
    });
    it('correctly returns what this.on returns', () => {
      const ret1 = myEmitter.addListener('test-further-in-on', incrementer);
      const ret2 = myEmitter.on('test-further-in-on', incrementer);
      expect(ret1).to.equal(ret2);
    });
  });
  describe('emit', () => {
    it('should correctly emit event with no arguments', () => {
      myEmitter.addListener('hello', incrementer);
      expect(count).to.equal(0);
      const ret = myEmitter.emit('hello');
      expect(count).to.equal(1);
      expect(ret).to.be.true;
    });
    it('should correctly emit event with multiple arguments', () => {
      const obj = {
        count: 5,
      };
      myEmitter.addListener('hello', incrementer3);
      expect(obj.count).to.equal(5);
      const ret = myEmitter.emit('hello', obj, 3);
      expect(obj.count).to.equal(8);
      expect(ret).to.be.true;
    });
    it('should correctly `emit` event that has no listeners', () => {
      expect(count).to.equal(0);
      const ret = myEmitter.emit('hello'); // note: didn't call addListener first.
      expect(count).to.equal(0);
      expect(ret).to.be.false;
    });
    it('should work with once', () => {
      const incrementer2 = (): number => count += 2;
      myEmitter.once('hello', incrementer);
      myEmitter.on('hello', incrementer2);
      myEmitter.once('hello', incrementer2);
      myEmitter.once('hello', incrementer);
      myEmitter.once('hello', incrementer2);
      const obj = {
        count: 5,
      };
      myEmitter.addListener('hello', incrementer3);
      expect(myEmitter.listenerCount('hello')).to.equal(6);
      expect(myEmitter.listeners('hello')[0]).to.equal(incrementer);
      myEmitter.removeListener('hello', incrementer);
      expect(myEmitter.listenerCount('hello')).to.equal(5);
      expect(myEmitter.listeners('hello')[0]).to.equal(incrementer2);
      myEmitter.emit('hello', obj, 3);
      expect(myEmitter.listenerCount('hello')).to.equal(2);
      expect(count).to.equal(7);
      expect(obj.count).to.equal(8);
      myEmitter.emit('hello', obj, 3);
      expect(count).to.equal(9);
      expect(obj.count).to.equal(11);
    });
  });
  describe('eventNames', () => {
    it('should work properly with no registered events', () => {
      expect(Array.isArray(myEmitter.eventNames())).to.be.true;
      expect(myEmitter.eventNames().length).to.equal(0);
    });
    it('should work properly with a couple string events', () => {
      myEmitter.addListener('hello', incrementer);
      myEmitter.addListener('hello', incrementer2);
      myEmitter.addListener('world', incrementer);
      const events = myEmitter.eventNames();
      expect(Array.isArray(events)).to.be.true;
      expect(events.length).to.equal(2);
      expect(events[0]).to.equal('hello');
      expect(events[1]).to.equal('world');
      expect(events[0]).to.not.equal(events[1]);
    });
    it('should work properly with a string and a symbol event', () => {
      const str = 'hello';
      const symbol = Symbol(str);
      myEmitter.addListener(str, incrementer);
      myEmitter.addListener(symbol, incrementer);
      const events = myEmitter.eventNames();
      expect(Array.isArray(events)).to.be.true;
      expect(events.length).to.equal(2);
      expect(events[0]).to.equal(str);
      expect(events[1]).to.equal(symbol);
      expect(events[0]).to.not.equal(events[1]);
    });
  });
  describe('getMaxListeners', () => {
    it('should work in default circumstance', () => {
      expect(myEmitter.getMaxListeners()).to.equal(EventEmitter.defaultMaxListeners);
    });
    it('should work when using a different number than the (static) default', () => {
      myEmitter.setMaxListeners(0);
      const maxListeners = myEmitter.getMaxListeners();
      expect(maxListeners).to.not.equal(EventEmitter.defaultMaxListeners);
      expect(maxListeners).to.equal(0);
    });
  });
  describe('listenerCount', () => {
    it('should be 0 for non-registered event', () => {
      expect(myEmitter.listenerCount('non-existant event')).to.equal(0);
    });
    it('should update properly in simple yet non-trivial cases with strings and symbols', () => {
      myEmitter.addListener('hello', incrementer);
      myEmitter.addListener('hello', incrementer2);
      const symbol = Symbol('hello');
      myEmitter.addListener(symbol, incrementer3);
      expect(myEmitter.listenerCount('non-existant event')).to.equal(0);
      const count1 = myEmitter.listenerCount('hello');
      const count2 = myEmitter.listenerCount(symbol);
      const count3 = myEmitter.listenerCount(Symbol('hello'));
      expect(count1).to.equal(2);
      expect(count2).to.equal(1);
      expect(count3).to.equal(0);
    });
  });
  describe('listeners', () => {
    it('should be 0 for non-registered event', () => {
      expect(Array.isArray(myEmitter.listeners('non-existant event'))).to.be.true;
      expect(myEmitter.listeners('non-existant event').length).to.equal(0);
    });
    it('should update properly in simple yet non-trivial cases with strings and symbols', () => {
      myEmitter.addListener('hello', incrementer);
      myEmitter.addListener('hello', incrementer2);
      const symbol = Symbol('hello');
      myEmitter.addListener(symbol, incrementer3);
      expect(myEmitter.listenerCount('non-existant event')).to.equal(0);
      const listeners1 = myEmitter.listeners('hello');
      const listeners2 = myEmitter.listeners(symbol);
      const listeners3 = myEmitter.listeners(Symbol('hello'));
      expect(listeners1.length).to.equal(2);
      expect(listeners2.length).to.equal(1);
      expect(listeners3.length).to.equal(0);
      expect(listeners1[0]).to.equal(incrementer);
      expect(listeners1[1]).to.equal(incrementer2);
      expect(listeners2[0]).to.equal(incrementer3);
    });
  });
  describe('off', () => {
    it('correctly calls (stubbed out) this.removeListener once', () => {
      const removeListener = sinon.stub(myEmitter, 'removeListener');
      myEmitter.off('test-further-in-removeListener', incrementer);
      expect(removeListener.callCount).to.equal(1);
    });
    it('correctly returns what this.removeListener returns', () => {
      const ret1 = myEmitter.off('test-further-in-removeListener', incrementer);
      const ret2 = myEmitter.removeListener('test-further-in-removeListener', incrementer);
      expect(ret1).to.equal(ret2);
    });
  });
  describe('on', () => {
    it('add a listener for an event, then correctly retrieve the listener', () => {
      const eventName = 'hello';
      myEmitter.on(eventName, incrementer);
      expect(Array.isArray(myEmitter.listeners(eventName))).to.be.true;
      expect(myEmitter.listeners(eventName).length).to.equal(1);
      expect(myEmitter.listeners(eventName)[0]).to.equal(incrementer);
    });
    it('should not add listener beyond this.getMaxListeners() threshhold', () => {
      const eventName = 'hello';
      myEmitter.setMaxListeners(0);
      myEmitter.on(eventName, incrementer);
      expect(myEmitter.listeners(eventName).length).to.equal(0);
    });
    it('should work with a symbol', () => {
      const eventName = Symbol('helloSymbol');
      myEmitter.on(eventName, incrementer);
      expect(myEmitter.getMaxListeners()).to.equal(EventEmitter.defaultMaxListeners);
      expect(Array.isArray(myEmitter.listeners(eventName))).to.be.true;
      expect(myEmitter.listeners(eventName).length).to.equal(1);
      expect(myEmitter.listeners(eventName)[0]).to.equal(incrementer);
    });
    it('should work with two symbols initialized with the same string literal', () => {
      const str = 'helloSymbol';
      const eventName1 = Symbol(str);
      const eventName2 = Symbol(str);
      myEmitter.on(eventName1, incrementer);
      myEmitter.on(eventName2, incrementer2);
      expect(Array.isArray(myEmitter.listeners(eventName1))).to.be.true;
      expect(Array.isArray(myEmitter.listeners(eventName2))).to.be.true;
      expect(myEmitter.listeners(eventName1).length).to.equal(1); // avoid RT failure
      expect(myEmitter.listeners(eventName2).length).to.equal(1); // avoid RT failure
      expect(myEmitter.listeners(eventName1)[0]).to.equal(incrementer);
      expect(myEmitter.listeners(eventName1)[0]).to.not.equal(incrementer2); // sanity check
      expect(myEmitter.listeners(eventName2)[0]).to.equal(incrementer2);
      expect(myEmitter.listeners(eventName2)[0]).to.not.equal(incrementer); // sanity check
      /**
       * This works fine, since it's implemented using Map, which supports keys of type (string | Symbol)
       */
      expect(String(eventName1)).to.equal(String(eventName2));
    });
  });
  describe('once', () => {
    it('should remove once-listeners from event listeners after one emission of that event', () => {
      myEmitter.on('hello', incrementer);
      myEmitter.once('hello', incrementer2);
      myEmitter.once('hello', incrementer);
      myEmitter.on('hello', incrementer2);
      const listeners1 = myEmitter.listeners('hello');
      myEmitter.emit('hello');
      const listeners2 = myEmitter.listeners('hello');
      expect(listeners1.length).to.equal(4);
      expect(listeners2.length).to.equal(2);
      expect(listeners2[0]).to.equal(incrementer);
      expect(listeners2[1]).to.equal(incrementer2);
    });
  });
  describe('prependListener', () => {
    it('should work correctly on new event', () => {
      myEmitter.prependListener('new-event', incrementer);
      const listeners = myEmitter.listeners('new-event');
      expect(listeners.length).to.equal(1);
      expect(listeners[0]).to.equal(incrementer);
    });
    it('should work correctly on event with listeners', () => {
      myEmitter.addListener('hello', incrementer2);
      myEmitter.prependListener('hello', incrementer);
      const listeners = myEmitter.listeners('hello');
      expect(listeners.length).to.equal(2);
      expect(listeners[0]).to.equal(incrementer);
      expect(listeners[1]).to.equal(incrementer2);
    });
  });
  describe('prependOnceListener', () => {
    it('should work correctly on new event', () => {
      myEmitter.prependOnceListener('new-event', incrementer);
      const listeners = myEmitter.listeners('new-event');
      expect(listeners.length).to.equal(1);
      expect(listeners[0]).to.equal(incrementer);
      myEmitter.emit('new-event');
      const listeners1 = myEmitter.listeners('new-event');
      expect(listeners1.length).to.equal(0);
    });
    it('should work correctly on event with listeners', () => {
      myEmitter.addListener('hello', incrementer2);
      myEmitter.prependOnceListener('hello', incrementer);
      const listeners = myEmitter.listeners('hello');
      expect(listeners.length).to.equal(2);
      expect(listeners[0]).to.equal(incrementer);
      expect(listeners[1]).to.equal(incrementer2);
      myEmitter.emit('hello');
      const listeners1 = myEmitter.listeners('hello');
      expect(listeners1.length).to.equal(1);
      expect(listeners1[0]).to.equal(incrementer2);
    });
  });
  describe('removeAllListeners', () => {
    it('should work with once', () => {
      myEmitter.addListener('hello', incrementer);
      myEmitter.once('hello', incrementer3);
      myEmitter.addListener('hello', incrementer2);
      myEmitter.addListener('world', incrementer2);
      myEmitter.removeAllListeners('hello');
      const helloCount = myEmitter.listenerCount('hello');
      const worldCount = myEmitter.listenerCount('world');
      expect(helloCount).to.equal(0);
      expect(worldCount).to.equal(1);
      const emitted = myEmitter.emit('hello');
      expect(emitted).to.be.false;
      expect(myEmitter.emit('world')).to.be.true;
    });
    it('should work without eventName argument', () => {
      myEmitter.addListener('hello', incrementer);
      myEmitter.addListener('hello', incrementer2);
      myEmitter.addListener('world', incrementer3);
      myEmitter.removeAllListeners();
      const helloCount = myEmitter.listenerCount('hello');
      const worldCount = myEmitter.listenerCount('world');
      expect(helloCount).to.equal(0);
      expect(worldCount).to.equal(0);
    });
    it('should work with eventName argument', () => {
      myEmitter.addListener('hello', incrementer);
      myEmitter.addListener('hello', incrementer2);
      myEmitter.addListener('world', incrementer3);
      myEmitter.removeAllListeners('hello');
      const helloCount = myEmitter.listenerCount('hello');
      const worldCount = myEmitter.listenerCount('world');
      expect(helloCount).to.equal(0);
      expect(worldCount).to.equal(1);
    });
    it('should not modify this._eventNames (as per the Node.js spec)', () => {
      myEmitter.addListener('hello', incrementer);
      myEmitter.addListener('hello', incrementer2);
      myEmitter.addListener('world', incrementer3);
      const namesBefore = myEmitter.eventNames();
      myEmitter.removeAllListeners('hello');
      const helloCount = myEmitter.listenerCount('hello');
      const worldCount = myEmitter.listenerCount('world');
      expect(helloCount).to.equal(0);
      expect(worldCount).to.equal(1);
      const namesAfter = myEmitter.eventNames();
      expect(namesBefore[0]).to.equal('hello');
      expect(namesBefore[1]).to.equal('world');
      expect(namesAfter[0]).to.equal('hello');
      expect(namesAfter[1]).to.equal('world');
    });
  });
  describe('removeListener', () => {
    it('should work when event is non-existent', () => {
      const e = 'non-existent event';
      myEmitter.removeListener(e, incrementer);
      const listeners = myEmitter.listeners(e);
      expect(Array.isArray(listeners)).to.be.true;
      expect(listeners.length).to.equal(0);
    });
    it('should update properly in simple yet non-trivial cases with strings and symbols', () => {
      myEmitter.addListener('hello', incrementer);
      myEmitter.addListener('hello', incrementer2);
      myEmitter.addListener('hello', incrementer);
      myEmitter.addListener('hello', incrementer);
      const symbol = Symbol('hello');
      myEmitter.addListener(symbol, incrementer3);
      myEmitter.addListener(symbol, incrementer3);
      myEmitter.addListener(symbol, incrementer);
      myEmitter.addListener(symbol, incrementer3);
      expect(myEmitter.listenerCount('non-existant event')).to.equal(0);
      myEmitter.removeListener('hello', incrementer);
      myEmitter.removeListener(symbol, incrementer2);
      myEmitter.removeListener(Symbol('hello'), incrementer);
      const listeners1 = myEmitter.listeners('hello');
      const listeners2 = myEmitter.listeners(symbol);
      const listeners3 = myEmitter.listeners(Symbol('hello'));
      expect(listeners1.length).to.equal(3);
      expect(listeners2.length).to.equal(4);
      expect(listeners3.length).to.equal(0);
      expect(listeners1[0]).to.equal(incrementer2);
      expect(listeners1[1]).to.equal(incrementer);
      expect(listeners2[0]).to.equal(incrementer3);
      myEmitter.removeListener('hello', incrementer);
      const listeners1again = myEmitter.listeners('hello');
      expect(listeners1again.length).to.equal(2);
    });
    it('should work with once', () => {
      myEmitter.once('hello', incrementer);
      myEmitter.once('hello', incrementer2);
      myEmitter.once('world', incrementer3);
      myEmitter.removeListener('hello', incrementer2);
      const helloCount = myEmitter.listenerCount('hello');
      const worldCount = myEmitter.listenerCount('world');
      expect(helloCount).to.equal(1);
      expect(worldCount).to.equal(1);
    });
    it('ensure array returned from this.listeners is recreated', () => {
      myEmitter.on('hello', incrementer);
      myEmitter.on('hello', incrementer2);
      myEmitter.on('world', incrementer3);
      const listenersHello = myEmitter.listeners('hello');
      const listenersWorld = myEmitter.listeners('world');
      myEmitter.removeListener('hello', incrementer2);
      const listenersHello2 = myEmitter.listeners('hello');
      const listenersWorld2 = myEmitter.listeners('world');
      expect(listenersHello).to.not.equal(listenersHello2);
      expect(listenersWorld).to.equal(listenersWorld2);
    });
  });
  describe('setMaxListeners', () => {
    it('should work (with integers)', () => {
      const max = EventEmitter.defaultMaxListeners + 5;
      myEmitter.setMaxListeners(max);
      expect(myEmitter.getMaxListeners()).to.equal(max);
    });
    it('should work (with non-integers)', () => {
      const max = EventEmitter.defaultMaxListeners + 2.7;
      myEmitter.setMaxListeners(max);
      expect(myEmitter.getMaxListeners()).to.equal(EventEmitter.defaultMaxListeners);
    });
  });
  describe('rawListeners', () => {
    it('should work with the example in the official Node.js documentation for .rawListeners() (switched logging, in their example, with incrementing, here).', () => {
      myEmitter.once('increment', () => incrementer());

      // Returns a new Array with a function `onceWrapper` which has a property
      // `listener` which contains the original listener bound above
      const listeners = myEmitter.rawListeners('increment');
      const logFnWrapper: OnceWrapper = <OnceWrapper>listeners[0];
      expect(listeners.length).to.equal(1);
      expect(logFnWrapper).to.haveOwnProperty('listener');
      expect(count).to.equal(0);

      // increments count by one once and does not unbind the `once` event
      logFnWrapper.listener();
      expect(count).to.equal(1);
      expect(myEmitter.listenerCount('increment')).to.equal(1);

      // increments count by one and removes the listener
      logFnWrapper();
      expect(count).to.equal(2);
      expect(myEmitter.listenerCount('increment')).to.equal(0);

      myEmitter.on('increment', () => incrementer());
      expect(myEmitter.listenerCount('increment')).to.equal(1);
      // will return a new Array with a single function bound by `.on()` above
      const newListeners: Array<Function> = myEmitter.rawListeners('increment');

      // increments count twice more
      newListeners[0]();
      expect(count).to.equal(3);
      myEmitter.emit('increment');
      expect(count).to.equal(4);
      expect(myEmitter.listenerCount('increment')).to.equal(1);
    });
  });
  describe('Event: `newListener` stub checks', () => {
    it('works with .on()', () => {
      const emit = sinon.stub(myEmitter, 'emit');
      myEmitter.on('test-emit', incrementer);
      expect(emit.callCount).to.equal(1);
      expect(emit.calledWith('newListener')).to.be.true;
    });
    it('works with .addListener()', () => {
      const emit = sinon.stub(myEmitter, 'emit');
      myEmitter.addListener('test-emit', incrementer);
      expect(emit.callCount).to.equal(1);
      expect(emit.calledWith('newListener')).to.be.true;
    });
    it('works with .once()', () => {
      const emit = sinon.stub(myEmitter, 'emit');
      myEmitter.once('test-emit', incrementer);
      expect(emit.callCount).to.equal(1);
      expect(emit.calledWith('newListener')).to.be.true;
    });
  });
  describe('Event: `removeListener` spy+stub checks', () => {
    it('works with .emit() when called after .once() (spy check)', () => {
      const emitSpy = sinon.spy(myEmitter, 'emit');
      myEmitter.once('test-emit', incrementer);
      expect(emitSpy.callCount).to.equal(1);
      myEmitter.emit('test-emit');
      expect(emitSpy.callCount).to.equal(3);
      expect(emitSpy.calledWith('removeListener')).to.be.true;
    });
    it('works with .removeListener()', () => {
      const emit = sinon.stub(myEmitter, 'emit');
      myEmitter.on('test-emit', incrementer);
      expect(emit.callCount).to.equal(1);
      expect(emit.calledWith('newListener')).to.be.true;
      myEmitter.removeListener('test-emit', incrementer);
      expect(emit.callCount).to.equal(2);
      expect(emit.calledWith('removeListener')).to.be.true;
    });
    it('works with .removeAllListeners() with no argument', () => {
      const emit = sinon.stub(myEmitter, 'emit');
      myEmitter.on('test-emit', incrementer);
      myEmitter.on('test-emit', incrementer2);
      myEmitter.on('test-emit', incrementer3);
      myEmitter.on('test-emit2', incrementer);
      expect(emit.callCount).to.equal(4);
      expect(emit.calledWith('newListener')).to.be.true;
      myEmitter.removeAllListeners();
      expect(emit.callCount).to.equal(8);
      expect(emit.calledWith('removeListener')).to.be.true;
    });
    it('works with .removeAllListeners() with provided argument', () => {
      const emit = sinon.stub(myEmitter, 'emit');
      myEmitter.on('test-emit', incrementer);
      myEmitter.on('test-emit', incrementer2);
      myEmitter.on('test-emit', incrementer3);
      myEmitter.on('test-emit2', incrementer);
      expect(emit.callCount).to.equal(4);
      expect(emit.calledWith('newListener')).to.be.true;
      myEmitter.removeAllListeners('test-emit');
      expect(emit.callCount).to.equal(7);
      expect(emit.calledWith('removeListener')).to.be.true;
    });
  });
});