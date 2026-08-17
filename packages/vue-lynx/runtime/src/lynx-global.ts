// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export type GlobalEventHandler = (...args: unknown[]) => void;

/**
 * Lynx's `GlobalEventEmitter` JSModule. All members are optional because the
 * module is only present at runtime on-device; different call sites use
 * different subsets (`trigger` to dispatch, `addListener`/`removeListener` to
 * subscribe).
 */
export type GlobalEventEmitter = {
  trigger?: (eventName: string, params: unknown) => void;
  addListener?: (eventName: string, handler: GlobalEventHandler) => void;
  removeListener?: (eventName: string, handler: GlobalEventHandler) => void;
};

export type LynxGlobal =
  | {
    getJSModule?: (name: string) => GlobalEventEmitter | undefined;
  }
  | undefined;
