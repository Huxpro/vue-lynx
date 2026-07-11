// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Minimal Vue reimplementation of `@lynx-js/lynx-ui-radio-group`
// (React-only upstream). DOM shape and `ui-*` state classes match the
// original so the packaged genui CSS applies unchanged.
import {
  computed,
  defineComponent,
  h,
  inject,
  provide,
} from '@vue/runtime-core';
import type {
  ComputedRef,
  InjectionKey,
  SetupContext,
  VNodeChild,
} from '@vue/runtime-core';

import { UiButton, useUiButtonContext } from './button.js';

interface RadioGroupState {
  selectedValue: ComputedRef<string | null>;
  disabled: ComputedRef<boolean>;
  handleValueChange: (radioValue: string) => void;
}

const RadioGroupContextKey: InjectionKey<RadioGroupState> = Symbol(
  'lynx-ui-radio-group',
);

interface RadioState {
  value: ComputedRef<string>;
  disabled: ComputedRef<boolean>;
}

const RadioContextKey: InjectionKey<RadioState> = Symbol('lynx-ui-radio');

export const RadioGroupRoot = defineComponent({
  name: 'RadioGroupRoot',
  props: ['value', 'defaultValue', 'disabled', 'onValueChange'],
  setup(
    props: {
      value?: string;
      defaultValue?: string;
      disabled?: boolean;
      onValueChange?: (value: string) => void;
    },
    { slots }: SetupContext,
  ) {
    let uncontrolledValue: string | null = props.defaultValue ?? null;
    let lastValue: string | null = null;
    const isControlled = () => props.value !== undefined;

    const selectedValue = computed(() =>
      isControlled() ? props.value ?? null : uncontrolledValue
    );

    const sendOnValueChangeEvent = (value: string) => {
      if (lastValue !== value) {
        props.onValueChange?.(value);
        lastValue = value;
      }
    };

    const handleValueChange = (value: string) => {
      if (!isControlled()) {
        uncontrolledValue = value;
      }
      sendOnValueChangeEvent(value);
    };

    provide(RadioGroupContextKey, {
      selectedValue,
      disabled: computed(() => props.disabled ?? false),
      handleValueChange,
    });

    return (): VNodeChild => slots['default']?.();
  },
});

export const Radio = defineComponent({
  name: 'Radio',
  props: ['className', 'style', 'disabled', 'value', 'radioProps'],
  setup(
    props: {
      className?: string;
      style?: unknown;
      disabled?: boolean;
      value: string;
      radioProps?: Record<string, unknown>;
    },
    { slots }: SetupContext,
  ) {
    const group = inject(RadioGroupContextKey, null);
    if (!group) {
      throw new Error('<Radio/> must be used within <RadioGroup/>!');
    }
    const isEffectiveDisabled = computed(() =>
      (props.disabled ?? false) || group.disabled.value
    );
    const checked = computed(() =>
      props.value === group.selectedValue.value
    );
    provide(RadioContextKey, {
      value: computed(() => props.value),
      disabled: isEffectiveDisabled,
    });

    return (): VNodeChild =>
      h(
        UiButton,
        {
          className: [props.className, { 'ui-checked': checked.value }],
          style: props.style,
          disabled: isEffectiveDisabled.value,
          onClick: () => group.handleValueChange(props.value),
          buttonProps: props.radioProps,
        },
        { default: () => slots['default']?.() },
      );
  },
});

export const RadioIndicator = defineComponent({
  name: 'RadioIndicator',
  props: ['className', 'style', 'forceMount'],
  setup(
    props: {
      className?: string;
      style?: unknown;
      forceMount?: boolean;
    },
    { slots }: SetupContext,
  ) {
    const group = inject(RadioGroupContextKey, null);
    const radio = inject(RadioContextKey, null);
    const button = useUiButtonContext();

    return (): VNodeChild => {
      const checked = radio !== null
        && radio.value.value === group?.selectedValue.value;
      return h(
        'view',
        {
          class: [
            props.className,
            {
              'ui-checked': checked,
              'ui-disabled': radio?.disabled.value ?? false,
              'ui-active': button.active.value,
            },
          ],
          style: props.style,
        },
        (props.forceMount || checked) ? slots['default']?.() : undefined,
      );
    };
  },
});
