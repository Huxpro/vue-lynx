import { JSDOM } from 'jsdom';
import { LynxTestingEnv } from '@lynx-js/testing-environment';

const jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const lynxTestingEnv = new LynxTestingEnv(jsdom);

(globalThis as any).lynxTestingEnv = lynxTestingEnv;

lynxTestingEnv.switchToMainThread();

if (typeof (globalThis as any).registerWorkletInternal === 'undefined') {
  (globalThis as any).registerWorkletInternal = () => {};
}

await import('vue-lynx/main-thread');

const mainThreadFns = {
  renderPage: (globalThis as any).renderPage,
  vuePatchUpdate: (globalThis as any).vuePatchUpdate,
  processData: (globalThis as any).processData,
  updatePage: (globalThis as any).updatePage,
  updateGlobalProps: (globalThis as any).updateGlobalProps,
};

const mtGlobal = lynxTestingEnv.mainThread.globalThis as any;
Object.assign(mtGlobal, mainThreadFns);

lynxTestingEnv.switchToBackgroundThread();

await import('vue-lynx/entry-background');

const publishEventFn = (globalThis as any).publishEvent;
const bgGlobal = lynxTestingEnv.backgroundThread.globalThis as any;
bgGlobal.publishEvent = publishEventFn;

(globalThis as any).onSwitchedToMainThread = () => {
  Object.assign(globalThis, mainThreadFns);
};

(globalThis as any).onSwitchedToBackgroundThread = () => {
  if ((globalThis as any).lynxCoreInject?.tt) {
    (globalThis as any).lynxCoreInject.tt.publishEvent = publishEventFn;
  }
  (globalThis as any).publishEvent = publishEventFn;
};
