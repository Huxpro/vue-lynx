// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Minimal Vue reimplementation of `@lynx-js/lynx-ui-button` (React-only).
// Provides the tappable primitive with `ui-active` / `ui-disabled` state
// classes that the radio / checkbox shims build on.
import {
  computed,
  defineComponent,
  inject,
  provide,
  ref,
} from '@vue/runtime-core';
import type {
  ComputedRef,
  InjectionKey,
  SetupContext,
  VNodeChild,
} from '@vue/runtime-core';
import { h } from '@vue/runtime-core';

export interface UiButtonState {
  active: ComputedRef<boolean>;
  disabled: ComputedRef<boolean>;
}

export const UiButtonContextKey: InjectionKey<UiButtonState> = Symbol(
  'lynx-ui-button',
);

const inactiveState: UiButtonState = {
  active: computed(() => false),
  disabled: computed(() => false),
};

export function useUiButtonContext(): UiButtonState {
  return inject(UiButtonContextKey, inactiveState);
}

/**
 * Tappable view with active/disabled state classes. Mirrors lynx-ui's
 * `Button` primitive (tap + touch emulation for the pressed state).
 */
export const UiButton = defineComponent({
  name: 'UiButton',
  props: ['className', 'style', 'disabled', 'onClick', 'buttonProps'],
  setup(
    props: {
      className?: string | Record<string, boolean> | unknown[];
      style?: unknown;
      disabled?: boolean;
      onClick?: () => void;
      buttonProps?: Record<string, unknown>;
    },
    { slots }: SetupContext,
  ) {
    const active = ref(false);
    const isEffectiveActive = computed(() =>
      active.value && !(props.disabled ?? false)
    );
    provide(UiButtonContextKey, {
      active: isEffectiveActive,
      disabled: computed(() => props.disabled ?? false),
    });

    const handleTouchStart = () => {
      if (props.disabled) return;
      active.value = true;
    };
    const handleTouchEnd = () => {
      active.value = false;
    };
    const handleTap = () => {
      if (props.disabled) return;
      props.onClick?.();
    };

    return (): VNodeChild =>
      h(
        'view',
        {
          bindtap: handleTap,
          bindtouchstart: handleTouchStart,
          bindtouchend: handleTouchEnd,
          bindtouchcancel: handleTouchEnd,
          'event-through': false,
          style: props.style,
          class: [
            props.className,
            {
              'ui-active': isEffectiveActive.value,
              'ui-disabled': props.disabled ?? false,
            },
          ],
          ...props.buttonProps,
        },
        slots['default']?.(),
      );
  },
});
