export default interface IEventEmitter {
  // Event: 'newListener'
  // ENewListener: string;
  // Event: 'removeListener'
  // ERemoveListener: string;

  // listenerCount: (emitter: EventEmitter, eventName: string | Symbol): number;
  // defaultMaxListeners: number;

  addListener: (eventName: string | Symbol, listener: Function) => IEventEmitter;
  emit: (eventName: string | Symbol, ...args: Array<any>) => boolean;
  eventNames: () => Array<string | Symbol>;
  getMaxListeners: () => number;
  listenerCount: (eventName: string | Symbol) => number;
  listeners: (eventName: string | Symbol) => Array<Function>;
  off: (eventName: string | Symbol, listener: Function) => IEventEmitter;
  on: (eventName: string | Symbol, listener: Function) => IEventEmitter;
  once: (eventName: string | Symbol, listener: Function) => IEventEmitter;
  prependListener: (eventName: string | Symbol, listener: Function) => IEventEmitter;
  prependOnceListener: (eventName: string | Symbol, listener: Function) => IEventEmitter;
  removeAllListeners: (eventName?: string | Symbol) => IEventEmitter;
  removeListener: (eventName: string | Symbol, listener: Function) => IEventEmitter;
  setMaxListeners: (n: number) => IEventEmitter;
  rawListeners: (eventName: string | Symbol) => Array<Function | OnceWrapper>;
};

declare type wrappedOnce = (...args: Array<any>) => any;

export interface OnceWrapper extends wrappedOnce {
  (args?: Array<any>) : any;
  listener: wrappedOnce;
}

// = function(args: Array<any>): any {
//   this.listener = (...args: Array<any>): any => undefined;
// };

// export class OnceWrapper {
//   private self: IEventEmitter;
//   public listener: Function;
//   public onceWrapper: Function;
//   constructor(self: IEventEmitter, eventName: string | Symbol, listener: Function) {
//     this.self = self;
//     this.listener = listener;
//     const onceWrapperSelf = this;
//     this.onceWrapper = function(...args: Array<any>): any {
//       this.listener = onceWrapperSelf.listener;
//       self.removeListener(eventName, this.listener);
//       this.listener(...args);
//     };
//   }
// }