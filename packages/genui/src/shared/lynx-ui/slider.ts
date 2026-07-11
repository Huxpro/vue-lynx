// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Minimal Vue reimplementation of `@lynx-js/lynx-ui-slider` (React-only
// upstream). DOM shape matches the original: root → track (relative) →
// indicator (absolute, width = ratio) + thumb (absolute, left = ratio).
// Dragging measures the track's page rect once per gesture via the Lynx
// SelectorQuery `boundingClientRect` method and updates on touch moves.
import {
  computed,
  defineComponent,
  h,
  inject,
  provide,
  ref,
  watch,
} from '@vue/runtime-core';
import type {
  ComputedRef,
  InjectionKey,
  SetupContext,
  VNodeChild,
} from '@vue/runtime-core';

interface SliderState {
  currentValue: ComputedRef<number>;
  enableRTL: ComputedRef<boolean>;
}

const SliderContextKey: InjectionKey<SliderState> = Symbol('lynx-ui-slider');

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function snapToStep(value: number, step: number | undefined): number {
  if (!step || step <= 0) return value;
  return clamp01(Math.round(value / step) * step);
}

function getVisualRatio(value: number, enableRTL: boolean): number {
  return enableRTL ? 1 - value : value;
}

interface LynxTouch {
  pageX?: number;
  clientX?: number;
  x?: number;
}

interface LynxTouchEvent {
  touches?: LynxTouch[];
  changedTouches?: LynxTouch[];
  detail?: { x?: number };
}

function getTouchX(e: LynxTouchEvent): number | null {
  const touch = e.touches?.[0] ?? e.changedTouches?.[0];
  const x = touch?.pageX ?? touch?.clientX ?? touch?.x ?? e.detail?.x;
  return typeof x === 'number' ? x : null;
}

let sliderTrackIdCounter = 0;

declare const lynx: {
  createSelectorQuery(): {
    select(selector: string): {
      invoke(options: {
        method: string;
        params?: Record<string, unknown>;
        success?: (res: unknown) => void;
        fail?: (res: unknown) => void;
      }): { exec(): void };
    };
  };
};

export const SliderRoot = defineComponent({
  name: 'SliderRoot',
  props: [
    'value',
    'defaultValue',
    'step',
    'disabled',
    'enableRTL',
    'className',
    'style',
    'onDragging',
    'onValueChange',
    'onValueCommit',
  ],
  setup(
    props: {
      value?: number;
      defaultValue?: number;
      step?: number;
      disabled?: boolean;
      enableRTL?: boolean;
      className?: string;
      style?: unknown;
      onDragging?: (dragging: boolean) => void;
      onValueChange?: (value: number, source: string) => void;
      onValueCommit?: (value: number) => void;
    },
    { slots }: SetupContext,
  ) {
    const isControlled = () => props.value !== undefined;
    const currentValue = ref(
      snapToStep(
        clamp01(isControlled() ? props.value! : props.defaultValue ?? 0),
        props.step,
      ),
    );

    watch(
      () => props.value,
      (value) => {
        if (value === undefined) return;
        const next = snapToStep(clamp01(value), props.step);
        if (!isDragging) currentValue.value = next;
      },
    );

    const trackId = `a2ui-slider-track-${++sliderTrackIdCounter}`;
    let isDragging = false;
    let trackLeft = 0;
    let trackWidth = 0;
    let boundsReady = false;

    const measureBounds = (onReady?: () => void) => {
      try {
        lynx.createSelectorQuery()
          .select(`#${trackId}`)
          .invoke({
            method: 'boundingClientRect',
            success: (res: unknown) => {
              const rect = res as { left?: number; width?: number };
              if (typeof rect?.left === 'number') trackLeft = rect.left;
              if (typeof rect?.width === 'number') trackWidth = rect.width;
              boundsReady = trackWidth > 0;
              onReady?.();
            },
          })
          .exec();
      } catch {
        // SelectorQuery unavailable (e.g. non-Lynx test env) — dragging
        // degrades gracefully; layoutchange still records the width.
      }
    };

    const onTrackLayoutChange = (e: {
      detail?: { width?: number };
    }) => {
      if (typeof e.detail?.width === 'number' && e.detail.width > 0) {
        trackWidth = e.detail.width;
      }
    };

    const valueFromX = (x: number): number | null => {
      if (!boundsReady || trackWidth <= 0) return null;
      const raw = clamp01((x - trackLeft) / trackWidth);
      const ratio = props.enableRTL ? 1 - raw : raw;
      return snapToStep(ratio, props.step);
    };

    const applyMoveX = (x: number) => {
      const value = valueFromX(x);
      if (value === null) return;
      if (currentValue.value !== value) {
        currentValue.value = value;
        props.onValueChange?.(value, 'drag');
      }
    };

    const handleTouchStart = (e: LynxTouchEvent) => {
      if (props.disabled) return;
      isDragging = true;
      props.onDragging?.(true);
      const x = getTouchX(e);
      measureBounds(() => {
        if (x !== null) applyMoveX(x);
      });
    };

    const handleTouchMove = (e: LynxTouchEvent) => {
      if (!isDragging || props.disabled) return;
      const x = getTouchX(e);
      if (x !== null) applyMoveX(x);
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      props.onDragging?.(false);
      props.onValueCommit?.(currentValue.value);
    };

    provide(SliderContextKey, {
      currentValue: computed(() => currentValue.value),
      enableRTL: computed(() => props.enableRTL ?? false),
    });

    provide(SliderTrackBindingsKey, {
      trackId,
      onTrackLayoutChange,
    });

    return (): VNodeChild =>
      h(
        'view',
        {
          class: props.className,
          style: props.style,
          bindtouchstart: handleTouchStart,
          bindtouchmove: handleTouchMove,
          bindtouchend: handleTouchEnd,
          bindtouchcancel: handleTouchEnd,
          'event-through': false,
        },
        slots['default']?.(),
      );
  },
});

interface SliderTrackBindings {
  trackId: string;
  onTrackLayoutChange: (e: { detail?: { width?: number } }) => void;
}

const SliderTrackBindingsKey: InjectionKey<SliderTrackBindings> = Symbol(
  'lynx-ui-slider-track',
);

export const SliderTrack = defineComponent({
  name: 'SliderTrack',
  props: ['className', 'style'],
  setup(
    props: { className?: string; style?: unknown },
    { slots }: SetupContext,
  ) {
    const bindings = inject(SliderTrackBindingsKey, null);

    return (): VNodeChild =>
      h(
        'view',
        {
          id: bindings?.trackId,
          style: {
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            overflow: 'visible',
            zIndex: 0,
          },
          bindlayoutchange: bindings?.onTrackLayoutChange,
        },
        [
          h('view', { class: props.className, style: props.style }),
          slots['default']?.(),
        ],
      );
  },
});

export const SliderIndicator = defineComponent({
  name: 'SliderIndicator',
  props: ['className', 'style'],
  setup(props: { className?: string; style?: unknown }) {
    const slider = inject(SliderContextKey, null);

    return (): VNodeChild => {
      const value = slider?.currentValue.value ?? 0;
      const enableRTL = slider?.enableRTL.value ?? false;
      return h(
        'view',
        {
          style: {
            position: 'absolute',
            top: '0px',
            bottom: '0px',
            overflow: 'visible',
            ...(enableRTL ? { right: '0px' } : { left: '0px' }),
            width: `${value * 100}%`,
          },
        },
        [h('view', {
          class: props.className,
          style: { width: '100%', height: '100%', ...(props.style as object) },
        })],
      );
    };
  },
});

export const SliderThumb = defineComponent({
  name: 'SliderThumb',
  props: ['className', 'style'],
  setup(
    props: { className?: string; style?: unknown },
    { slots }: SetupContext,
  ) {
    const slider = inject(SliderContextKey, null);

    return (): VNodeChild => {
      const value = slider?.currentValue.value ?? 0;
      const enableRTL = slider?.enableRTL.value ?? false;
      return h(
        'view',
        {
          style: {
            position: 'absolute',
            top: '50%',
            left: `${getVisualRatio(value, enableRTL) * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          },
        },
        [
          h(
            'view',
            { class: props.className, style: props.style },
            slots['default']?.(),
          ),
        ],
      );
    };
  },
});
