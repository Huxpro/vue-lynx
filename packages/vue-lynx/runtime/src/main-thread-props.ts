// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { scheduleFlush } from './flush.js';
import { isIfrMainThread } from './ifr-env.js';
import { OP, pushOp } from './ops.js';
import { registerWorkletCtx } from './run-on-background.js';
import type { ShadowElement } from './shadow-element.js';
import type { Worklet } from './worklet-types.js';

interface EventSpec {
  type: string;
  name: string;
}

function parseMainThreadEvent(key: string): EventSpec | null {
  if (key.startsWith('global-bind')) {
    return { type: 'bindGlobalEvent', name: key.slice('global-bind'.length) };
  }
  if (key.startsWith('global-catch')) {
    return { type: 'catchGlobalEvent', name: key.slice('global-catch'.length) };
  }
  if (key.startsWith('catch')) {
    return { type: 'catchEvent', name: key.slice('catch'.length) };
  }
  if (/^bind(?!ingx)/.test(key)) {
    return { type: 'bindEvent', name: key.slice('bind'.length) };
  }
  return null;
}

/**
 * Apply the Lynx-only main-thread props shared by the vdom patcher and the
 * DOM-compatible ShadowElement surface used by runtime-vapor.
 */
export function applyMainThreadProp(
  element: ShadowElement,
  key: string,
  value: unknown,
): boolean {
  if (!key.startsWith('main-thread-')) return false;

  const suffix = key.slice('main-thread-'.length);
  if (suffix === 'ref') {
    if (
      value != null
      && typeof value === 'object'
      && '_wvid' in (value as Record<string, unknown>)
    ) {
      pushOp(
        OP.SET_MT_REF,
        element.uid,
        (value as { toJSON(): unknown }).toJSON(),
      );
    }
  } else {
    const event = parseMainThreadEvent(suffix);
    if (event && value != null) {
      if (!isIfrMainThread()) registerWorkletCtx(value as Worklet);
      pushOp(
        OP.SET_WORKLET_EVENT,
        element.uid,
        event.type,
        event.name,
        value,
      );
    } else if (event) {
      pushOp(OP.REMOVE_EVENT, element.uid, event.type, event.name);
    }
  }

  scheduleFlush();
  return true;
}
