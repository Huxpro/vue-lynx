// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Minimal Vue reimplementation of `@lynx-js/lynx-ui-checkbox` (React-only
// upstream). DOM shape and `ui-*` state classes match the original.
import {
  computed,
  defineComponent,
  h,
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

import { UiButton, useUiButtonContext } from './button.js';

interface CheckboxState {
  checked: ComputedRef<boolean>;
  indeterminate: ComputedRef<boolean>;
}

const CheckboxContextKey: InjectionKey<CheckboxState> = Symbol(
  'lynx-ui-checkbox',
);

export const Checkbox = defineComponent({
  name: 'Checkbox',
  props: [
    'className',
    'style',
    'checked',
    'defaultChecked',
    'disabled',
    'indeterminate',
    'onChange',
    'checkboxProps',
  ],
  setup(
    props: {
      className?: string;
      style?: unknown;
      checked?: boolean;
      defaultChecked?: boolean;
      disabled?: boolean;
      indeterminate?: boolean;
      onChange?: (checked: boolean) => void;
      checkboxProps?: Record<string, unknown>;
    },
    { slots }: SetupContext,
  ) {
    const uncontrolledChecked = ref(props.defaultChecked ?? false);
    const isControlled = () => props.checked !== undefined;
    const actualChecked = computed(() =>
      isControlled() ? props.checked ?? false : uncontrolledChecked.value
    );

    const handleValueChange = (newChecked: boolean) => {
      if (!isControlled()) {
        uncontrolledChecked.value = newChecked;
      }
      props.onChange?.(newChecked);
    };

    const handleClick = () => {
      if (props.indeterminate) {
        handleValueChange(true);
        return;
      }
      handleValueChange(!actualChecked.value);
    };

    provide(CheckboxContextKey, {
      checked: actualChecked,
      indeterminate: computed(() => props.indeterminate ?? false),
    });

    return (): VNodeChild =>
      h(
        UiButton,
        {
          disabled: props.disabled ?? false,
          onClick: handleClick,
          style: props.style,
          className: [
            props.className,
            {
              'ui-indeterminate': props.indeterminate ?? false,
              // Upstream intentionally keys this off the `checked` prop
              // (not the uncontrolled state) — mirrored for parity.
              'ui-checked': props.checked ?? false,
            },
          ],
          buttonProps: props.checkboxProps,
        },
        { default: () => slots['default']?.() },
      );
  },
});

export const CheckboxIndicator = defineComponent({
  name: 'CheckboxIndicator',
  props: ['className', 'style', 'forceMount'],
  setup(
    props: {
      className?: string;
      style?: unknown;
      forceMount?: boolean;
    },
    { slots }: SetupContext,
  ) {
    const checkbox = inject(CheckboxContextKey, null);
    const button = useUiButtonContext();

    return (): VNodeChild => {
      const checked = checkbox?.checked.value ?? false;
      const indeterminate = checkbox?.indeterminate.value ?? false;
      return h(
        'view',
        {
          style: props.style,
          class: [
            props.className,
            {
              'ui-indeterminate': indeterminate,
              'ui-checked': checked,
              'ui-active': button.active.value,
              'ui-disabled': button.disabled.value,
            },
          ],
        },
        (props.forceMount || checked || indeterminate)
          ? slots['default']?.()
          : undefined,
      );
    };
  },
});
