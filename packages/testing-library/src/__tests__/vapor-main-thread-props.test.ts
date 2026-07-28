import { beforeEach, describe, expect, it } from 'vitest';

import { OP } from 'vue-lynx/internal/ops';
import { ShadowElement } from '../../../vue-lynx/runtime/src/shadow-element.js';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';

describe('Vapor main-thread props', () => {
  beforeEach(() => {
    takeOps();
  });

  it('emits SET_MT_REF when runtime-vapor sets main-thread-ref as an attribute', () => {
    const element = new ShadowElement('view');
    const ref = {
      _wvid: 7,
      toJSON: () => ({ _wvid: 7, _initValue: null }),
    };

    element.setAttribute('main-thread-ref', ref);

    expect(takeOps()).toEqual([
      OP.SET_MT_REF,
      element.uid,
      { _wvid: 7, _initValue: null },
    ]);
  });

  it('emits SET_WORKLET_EVENT when runtime-vapor sets main-thread-bindtap', () => {
    const element = new ShadowElement('view');
    const handler = { _wkltId: 'vapor-worklet' };

    element.setAttribute('main-thread-bindtap', handler);

    expect(takeOps()).toEqual([
      OP.SET_WORKLET_EVENT,
      element.uid,
      'bindEvent',
      'tap',
      expect.objectContaining({ _wkltId: 'vapor-worklet' }),
    ]);
  });
});
