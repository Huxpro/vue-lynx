// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { ActionPlan } from '@openuidev/lang-core';
import { BuiltinActionType } from '@openuidev/lang-core';
import { z } from 'zod/v4';

import {
  defineComponent as vueDefineComponent,
  h,
  ref,
  watch,
} from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { Input, TextArea } from '../../../shared/lynx-ui/index.js';
import {
  useFormName,
  useOpenUI,
  useSetDefaultValue,
} from '../../core/context.js';
import { defineComponent } from '../../core/library.js';
import { actionPropSchema } from '../Action/index.js';

import '../../../../styles/openui/catalog/TextField.css';

const CONTINUE_CONVERSATION_ACTION = String(
  BuiltinActionType.ContinueConversation,
);
const OPEN_URL_ACTION = String(BuiltinActionType.OpenUrl);

const TEXT_FIELD_VARIANTS = [
  'longText',
  'number',
  'shortText',
  'obscured',
] as const;

const textFieldPropsSchema = z.object({
  label: z.string(),
  value: z.string().optional(),
  variant: z.enum(TEXT_FIELD_VARIANTS).optional(),
  validationRegexp: z.string().optional(),
  action: actionPropSchema.optional(),
  name: z.string().optional(),
});

type TextFieldProps = z.infer<typeof textFieldPropsSchema>;

function normalizeVariant(
  variant: unknown,
): typeof TEXT_FIELD_VARIANTS[number] {
  return TEXT_FIELD_VARIANTS.includes(
      variant as typeof TEXT_FIELD_VARIANTS[number],
    )
    ? variant as typeof TEXT_FIELD_VARIANTS[number]
    : 'shortText';
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' || typeof value === 'boolean'
    || typeof value === 'bigint'
  ) {
    return String(value);
  }
  return '';
}

function isValueValid(value: string, regexp: string | undefined): boolean {
  if (!regexp) return true;
  try {
    return new RegExp(regexp).test(value);
  } catch {
    return true;
  }
}

const TextFieldRenderer = vueDefineComponent({
  name: 'OpenUITextFieldRenderer',
  props: ['props', 'renderNode', 'statementId', 'onAction'],
  setup(rp: { props: TextFieldProps }) {
    const ctx = useOpenUI();
    const formName = useFormName();
    const draft = ref<string>(normalizeValue(rp.props.value));
    let dirty = false;

    useSetDefaultValue({
      ...(formName ? { formName: () => formName } : {}),
      componentType: 'TextField',
      name: () => rp.props.name ?? '',
      existingValue: () =>
        rp.props.name
          ? ctx.getFieldValue(formName, rp.props.name)
          : undefined,
      defaultValue: () =>
        rp.props.name && rp.props.value !== undefined
          ? normalizeValue(rp.props.value)
          : undefined,
    });

    watch(
      [() => rp.props.name, () => rp.props.value],
      () => {
        if (!dirty) {
          const next = normalizeValue(rp.props.value);
          draft.value = next;
          if (rp.props.name && rp.props.value !== undefined) {
            ctx.setFieldValue(
              formName,
              'TextField',
              rp.props.name,
              next,
              false,
            );
          }
        }
      },
      { immediate: true },
    );

    const onInput = (next: string) => {
      dirty = true;
      draft.value = next;
      if (rp.props.name) {
        ctx.setFieldValue(formName, 'TextField', rp.props.name, next, false);
      }
      if (!rp.props.action) return;
      if ('steps' in rp.props.action) {
        void ctx.triggerAction(
          next,
          formName,
          rp.props.action as ActionPlan,
        );
        return;
      }
      const legacyAction = rp.props.action;
      const actionType = legacyAction?.type ?? CONTINUE_CONVERSATION_ACTION;
      const actionParams = actionType === OPEN_URL_ACTION
        ? { url: legacyAction?.url }
        : {
          ...(legacyAction?.params ?? {}),
          ...(legacyAction?.context ? { context: legacyAction.context } : {}),
        };
      void ctx.triggerAction(next, formName, {
        type: actionType,
        params: actionParams,
      });
    };

    return (): VNodeChild => {
      const props = rp.props;
      const variant = normalizeVariant(props.variant);
      const invalid = !isValueValid(draft.value, props.validationRegexp);
      const showInvalid = invalid && draft.value.length > 0;

      const rootClassName = showInvalid
        ? `OpenUITextField OpenUITextField-${variant} OpenUITextField-invalid`
        : `OpenUITextField OpenUITextField-${variant}`;

      const controlClassName = variant === 'longText'
        ? 'OpenUITextFieldControl OpenUITextFieldTextarea'
        : 'OpenUITextFieldControl';

      return h('view', { class: rootClassName }, [
        h('text', { class: 'OpenUITextFieldLabel' }, props.label),
        variant === 'longText'
          ? h(TextArea, {
            className: controlClassName,
            value: draft.value,
            maxLines: 6,
            confirmType: 'done',
            onInput,
          })
          : h(Input, {
            className: controlClassName,
            value: draft.value,
            type: variant === 'number'
              ? 'number'
              : (variant === 'obscured'
                ? 'password'
                : 'text'),
            confirmType: 'done',
            onInput,
          }),
        showInvalid
          ? h('text', { class: 'OpenUITextFieldError' }, 'Invalid value')
          : null,
      ]);
    };
  },
});

export const TextField = defineComponent({
  name: 'TextField',
  props: textFieldPropsSchema,
  description:
    'Single-line or multi-line text input. Supports shortText, number, obscured (password), and longText (multi-line) variants with optional regex validation.',
  component: TextFieldRenderer,
});
