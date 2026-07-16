// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Minimal Vue reimplementation of `@lynx-js/lynx-ui-input` (React-only
// upstream). Wraps the native Lynx `input` / `textarea` elements. The
// upstream controlled-value flow uses main-thread IME locking +
// `invoke setValue`; this port passes the `value` attribute directly,
// which is sufficient for the genui catalog's draft-value pattern.
import { defineComponent, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

interface InputDetailEvent {
  detail: {
    value: string;
    selectionStart: number;
    selectionEnd: number;
    isComposing?: boolean;
  };
}

export interface InputLikeProps {
  id?: string;
  className?: string;
  style?: unknown;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  readonly?: boolean;
  maxLength?: number;
  confirmType?: string;
  onInput?: (
    value: string,
    selectionStart?: number,
    selectionEnd?: number,
    isComposing?: boolean,
  ) => void;
  onFocus?: (value: string) => void;
  onBlur?: (value: string) => void;
  onConfirm?: (value: string) => void;
}

function inputEventProps(props: InputLikeProps): Record<string, unknown> {
  return {
    bindinput: (e: InputDetailEvent) => {
      props.onInput?.(
        e.detail.value,
        e.detail.selectionStart,
        e.detail.selectionEnd,
        e.detail.isComposing,
      );
    },
    bindfocus: (e: InputDetailEvent) => props.onFocus?.(e.detail.value),
    bindblur: (e: InputDetailEvent) => props.onBlur?.(e.detail.value),
    bindconfirm: (e: InputDetailEvent) => props.onConfirm?.(e.detail.value),
  };
}

const INPUT_PROPS = [
  'id',
  'className',
  'style',
  'value',
  'defaultValue',
  'placeholder',
  'type',
  'readonly',
  'maxLength',
  'confirmType',
  'onInput',
  'onFocus',
  'onBlur',
  'onConfirm',
];

export const Input = defineComponent({
  name: 'UiInput',
  props: INPUT_PROPS,
  setup(props: InputLikeProps) {
    return (): VNodeChild =>
      h('input', {
        id: props.id,
        class: props.className,
        style: props.style,
        value: props.value ?? props.defaultValue ?? '',
        placeholder: props.placeholder,
        type: props.type ?? 'text',
        readonly: props.readonly ?? false,
        maxlength: props.maxLength ?? 140,
        'confirm-type': props.confirmType ?? 'send',
        ...inputEventProps(props),
      });
  },
});

export const TextArea = defineComponent({
  name: 'UiTextArea',
  props: [...INPUT_PROPS, 'maxLines'],
  setup(props: InputLikeProps & { maxLines?: number }) {
    return (): VNodeChild =>
      h('textarea', {
        id: props.id,
        class: props.className,
        style: props.style,
        value: props.value ?? props.defaultValue ?? '',
        placeholder: props.placeholder,
        readonly: props.readonly ?? false,
        maxlength: props.maxLength ?? 140,
        maxlines: props.maxLines,
        'confirm-type': props.confirmType ?? 'send',
        ...inputEventProps(props),
      });
  },
});
