// Copyright 2026 The Vue Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * `useAnimaX` — a typed controller for an `<animax-view>` template ref.
 *
 * The element's playback methods are native UI methods reached through
 * `NodesRef.invoke`. The controller turns each into a Promise so a
 * component can `await animax.play()` instead of hand-writing the
 * `{ method, params, success, fail }` object and the `.exec()` call.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTemplateRef } from 'vue'
 * import { useAnimaX } from 'vue-lynx'
 *
 * const player = useTemplateRef<ShadowElement>('player')
 * const animax = useAnimaX(player)
 * </script>
 *
 * <template>
 *   <animax-view ref="player" src="https://example.com/gift.json" :autoplay="false" />
 *   <view @tap="animax.play()" />
 * </template>
 * ```
 */

import type { Ref } from '@vue/runtime-core';

import type { ShadowElement } from './shadow-element.js';

export type AnimaXTarget =
  | Ref<ShadowElement | null | undefined>
  | (() => ShadowElement | null | undefined);

export interface AnimaXController {
  play(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  /** Jump to a frame without changing the playing state. */
  seek(frame: number): Promise<void>;
  /** Play one frame range once. */
  playSegment(startFrame: number, endFrame: number): Promise<void>;
  /** Duration in milliseconds. */
  getDuration(): Promise<number>;
  getCurrentFrame(): Promise<number>;
  isAnimating(): Promise<boolean>;
  /** Fire an `update` event when playback reaches the frame. */
  subscribeUpdateEvent(frame: number): Promise<void>;
  subscribeUpdateEvents(frames: number[]): Promise<void>;
  unsubscribeUpdateEvent(frame: number): Promise<void>;
  unsubscribeUpdateEvents(frames: number[]): Promise<void>;
}

interface InvokeResult {
  data?: unknown;
}

function resolveTarget(target: AnimaXTarget): ShadowElement | null {
  const el = typeof target === 'function' ? target() : target.value;
  return el ?? null;
}

function invoke<T>(
  target: AnimaXTarget,
  method: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const el = resolveTarget(target);
  if (!el) {
    return Promise.reject(
      new Error(
        `[vue-lynx] useAnimaX: no <animax-view> mounted for "${method}".`,
      ),
    );
  }
  return new Promise<T>((resolve, reject) => {
    el.invoke({
      method,
      params,
      success: (res: InvokeResult | T) => {
        const data = (res as InvokeResult)?.data;
        resolve((data === undefined ? res : data) as T);
      },
      fail: (res: { code: number; data?: unknown }) => {
        reject(
          new Error(
            `[vue-lynx] animax-view.${method} failed with code ${res.code}.`,
          ),
        );
      },
    }).exec();
  });
}

/**
 * Create a controller bound to an `<animax-view>` template ref (or a getter
 * returning the element). Methods reject when the element is not mounted.
 */
export function useAnimaX(target: AnimaXTarget): AnimaXController {
  return {
    play: () => invoke<void>(target, 'play'),
    pause: () => invoke<void>(target, 'pause'),
    resume: () => invoke<void>(target, 'resume'),
    stop: () => invoke<void>(target, 'stop'),
    seek: (frame) => invoke<void>(target, 'seek', { frame }),
    playSegment: (startFrame, endFrame) =>
      invoke<void>(target, 'playSegment', { startFrame, endFrame }),
    getDuration: () => invoke<number>(target, 'getDuration'),
    getCurrentFrame: () => invoke<number>(target, 'getCurrentFrame'),
    isAnimating: () => invoke<boolean>(target, 'isAnimating'),
    subscribeUpdateEvent: (frame) =>
      invoke<void>(target, 'subscribeUpdateEvent', { frame }),
    subscribeUpdateEvents: (frames) =>
      invoke<void>(target, 'subscribeUpdateEvents', { frames }),
    unsubscribeUpdateEvent: (frame) =>
      invoke<void>(target, 'unsubscribeUpdateEvent', { frame }),
    unsubscribeUpdateEvents: (frames) =>
      invoke<void>(target, 'unsubscribeUpdateEvents', { frames }),
  };
}
