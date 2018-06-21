import IEventEmitter, { OnceWrapper } from './EETypes';
export default class EventEmitter  implements IEventEmitter {
  private _ENewListener = 'newListener'; // Event: 'newListener'
  private _ERemoveListener = 'removeListener'; // Event: 'removeListener'

  private _listeners: Map<string | Symbol, Array<Function>>;
  private _onceListenerIndices: Map<string | Symbol, Array<number>>;
  private _maxListeners: number;
  /**
   * @description This is a work-around to get this class to properly work with
   * eventName of type Symbol (only working with string would be simpler).
   * A Map is used here, in order to get sub-linear time, ~O(1),
   * (on number of registered events) on calls to addListener.
   * @see https://stackoverflow.com/questions/33611509/es6-map-and-set-complexity-v8-implementation
   * @see https://stackoverflow.com/questions/31091772/javascript-es6-computational-time-complexity-of-collections/31092145#31092145
   */
  private _eventNames: Map<string | Symbol, boolean>;

  /**
   * @description deprecated functionality. Stability: 0. Better to use non-static .listenerCount()
   */
  static listenerCount = (emitter: EventEmitter, eventName: string | Symbol): number => {
    console.warn('Deprecated functionality. Stability: 0. Better to use non-static .listenerCount()');
    return emitter.listenerCount(eventName);
  };
  static defaultMaxListeners: number = 10;

  constructor() {
    this._listeners = new Map;
    this._onceListenerIndices = new Map;
    this._eventNames = new Map;
    this._maxListeners = EventEmitter.defaultMaxListeners;
  }

  /**
   * @description Alias for emitter.on(eventName, listener).
   * @param eventName 
   * @param listener 
   */
  public addListener(eventName: string | Symbol, listener: Function): IEventEmitter {
    return this.on(eventName, listener);
  };
  /**
   * @description Synchronously calls each of the listeners registered for the event named eventName, in the order they were registered,
   * passing the supplied arguments to each.
   * 
   * The 'removeListener' event is emitted after the listener is removed.
   * @returns true if the event had listeners, false otherwise.
   * @todo Nothing specified to do with Array<any>
   * @param eventName 
   * @param args
   * @see https://nodejs.org/api/events.html#events_event_removelistener
   */
  public emit(eventName: string | Symbol, ...args: Array<any>): boolean {
    const listeners = this.listeners(eventName);
    if (listeners.length !== 0) {
      listeners.forEach(l => {
        l(...args)
      });
      this.removeOnceListenersForEvent(eventName);
      this.emit(this._ERemoveListener);
      return true;
    }
    return false;
  }
  /**
   * @description O(n) time/space, in order to allow ~O(1) time for addEventListener
   */
  public eventNames(): Array<string | Symbol> {
    return Array.from(this._eventNames.keys());
  }
  public getMaxListeners(): number {
    return this._maxListeners;
  }
  /**
   * @description Returns the number of listeners listening to the event named eventName.
   * @param eventName 
   */
  public listenerCount(eventName: string | Symbol): number {
    return this.listeners(eventName).length;
  }
  public listeners(eventName: string | Symbol): Array<Function> {
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, []);
    }
    return this._listeners.get(eventName);
  }
  /**
   * @description Alias for emitter.removeListener().
   * @param eventName 
   * @param listener 
   */
  public off(eventName: string | Symbol, listener: Function): IEventEmitter {
    return this.removeListener(eventName, listener);
  }
  /**
   * @description Time analysis: Sub-linear (~O(1)) on number of registered events (ie using a Map
   * to properly register for eventName of type Symbol).
   * 
   * The EventEmitter instance will emit its own 'newListener' event before a 
   * listener is added to its internal array of listeners.
   * @param eventName 
   * @param listener 
   * @see https://nodejs.org/api/events.html#events_event_newlistener
   */
  public on(eventName: string | Symbol, listener: Function): IEventEmitter {
    if (this.listenerCount(eventName) < this._maxListeners) {
      this.emit(this._ENewListener);
      this.listeners(eventName).push(listener);
      if (!this._eventNames.has(eventName)) this._eventNames.set(eventName, true);
    } else {
      console.error('EventEmitter.on Failure: EventEmitter.defaultMaxListeners exceeded. Cannot add more listeners.');
    }
    return this;
  }
  /**
   * @description Adds a one-time listener function for the event named eventName. 
   * The next time eventName is triggered, this listener is removed and then invoked.
   * @param eventName 
   * @param listener 
   */
  public once(eventName: string | Symbol, listener: Function): IEventEmitter {
    this.on(eventName, listener);
    const listenerCount = this.listenerCount(eventName);
    if (listenerCount < this._maxListeners) {
      this.onceListeners(eventName).push(listenerCount - 1);
    } else {
      console.error('EventEmitter.once Failure: EventEmitter.defaultMaxListeners exceeded. Cannot add more listeners.');
    }
    return this;
  }
  /**
   * @returns Array<number> representing the index of the corresponding listener
   * that shall only be emitted once.
   * @param eventName 
   */
  private onceListeners(eventName: string | Symbol): Array<number> {
    if (!this._onceListenerIndices.has(eventName)) {
      this._onceListenerIndices.set(eventName, []);
    }
    return this._onceListenerIndices.get(eventName);
  }
  /**
   * @description O(n) time, where n is number of listeners for eventName.
   * Note that this also shifts the indices in this.onceListener by one.
   * @param eventName 
   * @param listener 
   */
  public prependListener(eventName: string | Symbol, listener: Function): IEventEmitter {
    const listeners = this.listeners(eventName);
    const updatedListeners: Array<Function> = [];
    updatedListeners.push(listener);
    listeners.forEach((l: Function) => updatedListeners.push(l));
    this._listeners.set(eventName, updatedListeners);
    this.shiftOnceListenerIndices(eventName);
    return this;
  }
  /**
   * @description helper of this.prependListener.
   * Shifts this.onceListeners by one (adds one to each index).
   * @param eventName 
   */
  private shiftOnceListenerIndices(eventName: string | Symbol): void {
    const onceListenerIndices = this._onceListenerIndices.get(eventName) || [];
    if (this._onceListenerIndices.get(eventName) !== undefined) {
      const updatedIndices = [];
      onceListenerIndices.forEach((idx: number) => updatedIndices.push(idx + 1));
      this._onceListenerIndices.set(eventName, updatedIndices);
    }
  }
  /**
   * @description O(n) time, where n is number of listeners for eventName
   * @param eventName 
   * @param listener 
   */
  public prependOnceListener(eventName: string | Symbol, listener: Function): IEventEmitter {
    this.prependListener(eventName, listener); // shifts this.onceListeners indices by one
    const listeners = this._onceListenerIndices.get(eventName) || [];
    const updatedListeners: Array<number> = [];
    updatedListeners.push(0);
    listeners.forEach((l: number) => updatedListeners.push(l));
    this._onceListenerIndices.set(eventName, updatedListeners);
    return this;
  }
  /**
   * @description Complexity Analysis:
   * 
   * Time: Define m to be the number of registered events. And define n(i) to
   * be the number of listeners registered for event i, where -1 < i < m.
   * 
   * There are two cases to consider:
   * 
   * 1) eventName === undefined:
   * O(m * n(i)^2), or more succinctly: O(mn^2).
   * 
   * 2) eventName !== undefined:
   * O(n(i)^2) for some particular event indexed by i, or more succinctly: O(n^2).
   * @param eventName 
   * @see https://nodejs.org/api/events.html#events_event_removelistener
   */
  public removeAllListeners(eventName?: string | Symbol): IEventEmitter {
    const removeAllListeners = (eventName: string | Symbol): void => {
      const listeners = this._listeners.get(eventName); // n listeners
      /**
       * O(n^2) time total. O(n) space to create new array of listeners after
       * removing each listener (in order to ensure .emit('removeListener) is properly
       * fired). Where n is the number of listeners registerd on eventName.
       */
      listeners.forEach((l: Function) => {
        this.removeListener(eventName, l);
      });
    }
    if (eventName === undefined) {
      const eventNames = this.eventNames();
      /**
       * O(m * n(i)^2) time, where n(i) is the number of listeners for one of the m eventNames.
       */
      eventNames.forEach((eventName: string | Symbol) => removeAllListeners(eventName));
    } else {
      removeAllListeners(eventName);
    }
    return this;
  }
  /**
   * @description This is simply a helper for this.emit.
   * @param eventName 
   */
  private removeOnceListenersForEvent(eventName: string | Symbol): void {
    const listeners = this.listeners(eventName);
    const onceListenerIndices = this.onceListeners(eventName);
    let onceListenerIdx = 0;
    const filteredListeners = listeners.filter((l, idx) => {
      if (idx === onceListenerIndices[onceListenerIdx]) {
        onceListenerIdx++;
        return false;
      } else {
        return true;
      }
    });
    this._listeners.set(eventName, filteredListeners);
    this._onceListenerIndices.set(eventName, []);
  }
  /**
   * @description Removes the specified listener from the listener array for the event named eventName.
   * removeListener() will remove, at most, one instance of a listener from the listener array. 
   * If any single listener has been added multiple times to the listener array for the specified eventName, 
   * then removeListener() must be called multiple times to remove each instance.
   * 
   * Because listeners are managed using an internal array, calling this will change 
   * the position indices of any listener registered after the listener being removed. 
   * This will not impact the order in which listeners are called, but it means that 
   * any copies of the listener array as returned by the emitter.listeners() method 
   * will need to be recreated.
   * 
   * Note that once an event has been emitted, all listeners attached to it at the 
   * time of emitting will be called in order. This implies that any removeListener() 
   * or removeAllListeners() calls after emitting and before the last listener 
   * finishes execution will not remove them from emit() in progress. 
   * Subsequent events will behave as expected.
   * 
   * ^^ note that the priorly mentioned behavior doesn't require any extra work by
   * this.emit. this.emit simply saves a local reference to the needed listeners 
   * for a given eventName.
   * 
   * @returns a reference to the EventEmitter, so that calls can be chained.
   * @param eventName 
   * @param listener 
   * @see https://nodejs.org/api/events.html#events_event_removelistener
   */
  public removeListener(eventName: string | Symbol, listener: Function): IEventEmitter {
    const listeners = this.listeners(eventName);
    let removedOnce = false;
    let removedIdx = -1;
    const filteredListeners = listeners.filter((eventListener, idx) => {
      if (!removedOnce && listener === eventListener) {
        removedOnce = true;
        removedIdx = idx;
        return false;
      } else {
        return true;
      }
    });
    this._listeners.set(eventName, filteredListeners);

    /* Update this.onceListeners indices */
    const onceListenersIndices = this._onceListenerIndices.get(eventName);
    if (onceListenersIndices !== undefined && removedIdx !== -1) {
      const filteredOnceListenerIndices = [];
      for (let i = 0; i < onceListenersIndices.length; i++) {
        if (onceListenersIndices[i] < removedIdx) {
          filteredOnceListenerIndices.push(onceListenersIndices[i]);
        } else if (onceListenersIndices[i] > removedIdx) {
          filteredOnceListenerIndices.push(onceListenersIndices[i] - 1);
        }
      }
      this._onceListenerIndices.set(eventName, filteredOnceListenerIndices);
    }

    this.emit(this._ERemoveListener);

    return this;
  }
  public setMaxListeners(n: number): IEventEmitter {
    if (Number.isInteger(n))
      this._maxListeners = n;
    else console.error('EventEmitter.setMaxListeners Failure: Must pass in an integer-valued number.');
    return this;
  }
  public rawListeners(eventName: string | Symbol): Array<Function | OnceWrapper> {
    const rawListeners = [];
    const onceIndices = this._onceListenerIndices.get(eventName);
    const listeners = this._listeners.get(eventName);
    let onceIndicesIdx = 0;
    listeners.forEach((l: Function, idx: number) => {
      if (idx === onceIndices[onceIndicesIdx]) {
        const self = this;
        /**
         * @description sexy learning experience here : D
         */
        const onceWrapper: OnceWrapper = Object.assign(
          function(args?: Array<any>) {
            self.removeListener(eventName, l);
            l(...args);
          },
          { listener: (...args) => l(...args) },
        );
        rawListeners.push(onceWrapper);
      } else {
        rawListeners.push(l);
      }
    });
    return rawListeners;
  }
}