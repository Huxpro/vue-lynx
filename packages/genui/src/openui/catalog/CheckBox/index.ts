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

import {
  useFormName,
  useOpenUI,
  useSetDefaultValue,
} from '../../core/context.js';
import { defineComponent } from '../../core/library.js';
import { actionPropSchema } from '../Action/index.js';

import '../../../../styles/openui/catalog/CheckBox.css';

const CONTINUE_CONVERSATION_ACTION = String(
  BuiltinActionType.ContinueConversation,
);
const OPEN_URL_ACTION = String(BuiltinActionType.OpenUrl);

const checkBoxPropsSchema = z.object({
  label: z.string(),
  value: z.boolean().optional(),
  action: actionPropSchema.optional(),
  name: z.string().optional(),
});

type CheckBoxProps = z.infer<typeof checkBoxPropsSchema>;

const CheckBoxRenderer = vueDefineComponent({
  name: 'OpenUICheckBoxRenderer',
  props: ['props', 'renderNode', 'statementId', 'onAction'],
  setup(rp: { props: CheckBoxProps }) {
    const ctx = useOpenUI();
    const formName = useFormName();
    const checked = ref<boolean>(rp.props.value === true);
    let dirty = false;

    useSetDefaultValue({
      ...(formName ? { formName: () => formName } : {}),
      componentType: 'CheckBox',
      name: () => rp.props.name ?? '',
      existingValue: () =>
        rp.props.name
          ? ctx.getFieldValue(formName, rp.props.name)
          : undefined,
      defaultValue: () =>
        rp.props.name && rp.props.value !== undefined
          ? rp.props.value === true
          : undefined,
    });

    watch(
      [() => rp.props.name, () => rp.props.value],
      () => {
        if (!dirty) {
          const next = rp.props.value === true;
          checked.value = next;
          if (rp.props.name && rp.props.value !== undefined) {
            ctx.setFieldValue(formName, 'CheckBox', rp.props.name, next, false);
          }
        }
      },
      { immediate: true },
    );

    const onChange = (next: boolean) => {
      dirty = true;
      checked.value = next;
      if (rp.props.name) {
        ctx.setFieldValue(formName, 'CheckBox', rp.props.name, next, true);
      }
      if (ctx.isStreaming || !rp.props.action) return;
      if ('steps' in rp.props.action) {
        void ctx.triggerAction(
          rp.props.label,
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
      void ctx.triggerAction(rp.props.label, formName, {
        type: actionType,
        params: actionParams,
      });
    };
    const onToggle = () => onChange(!checked.value);

    return (): VNodeChild =>
      h(
        'view',
        {
          class: 'OpenUICheckBoxRow',
          ...(ctx.isStreaming ? {} : { bindtap: onToggle }),
        },
        [
          h(
            'view',
            {
              class: checked.value
                ? 'OpenUICheckBoxInput ui-checked'
                : 'OpenUICheckBoxInput',
            },
            checked.value
              ? [h('text', { class: 'OpenUICheckBoxMark' }, '✓')]
              : [],
          ),
          h('view', { class: 'OpenUICheckBoxLabelHitbox' }, [
            h('text', { class: 'OpenUICheckBoxLabel' }, rp.props.label),
          ]),
        ],
      );
  },
});

export const CheckBox = defineComponent({
  name: 'CheckBox',
  props: checkBoxPropsSchema,
  description:
    'Toggleable checkbox. Visual state updates locally on tap; the action fires for the LLM to persist the change.',
  component: CheckBoxRenderer,
});
