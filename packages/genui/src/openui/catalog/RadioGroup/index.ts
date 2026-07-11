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
  Radio,
  RadioGroupRoot,
  RadioIndicator,
} from '../../../shared/lynx-ui/index.js';
import {
  useFormName,
  useOpenUI,
  useSetDefaultValue,
} from '../../core/context.js';
import { defineComponent } from '../../core/library.js';
import { actionPropSchema } from '../Action/index.js';

import '../../../../styles/openui/catalog/RadioGroup.css';

const CONTINUE_CONVERSATION_ACTION = String(
  BuiltinActionType.ContinueConversation,
);
const OPEN_URL_ACTION = String(BuiltinActionType.OpenUrl);

const HitSlop = {
  'hit-slop': {
    top: '8px' as `${number}px`,
    left: '8px' as `${number}px`,
    right: '8px' as `${number}px`,
    bottom: '8px' as `${number}px`,
  },
};

const radioGroupPropsSchema = z.object({
  items: z.array(z.string()),
  value: z.string().optional(),
  usageHint: z.enum(['default', 'card', 'row']).optional(),
  action: actionPropSchema.optional(),
  name: z.string().optional(),
});

type RadioGroupProps = z.infer<typeof radioGroupPropsSchema>;

const RadioGroupRenderer = vueDefineComponent({
  name: 'OpenUIRadioGroupRenderer',
  props: ['props', 'renderNode', 'statementId', 'onAction'],
  setup(rp: { props: RadioGroupProps }) {
    const ctx = useOpenUI();
    const formName = useFormName();
    const selected = ref<string>(rp.props.value ?? '');
    let dirty = false;

    useSetDefaultValue({
      ...(formName ? { formName: () => formName } : {}),
      componentType: 'RadioGroup',
      name: () => rp.props.name ?? '',
      existingValue: () =>
        rp.props.name
          ? ctx.getFieldValue(formName, rp.props.name)
          : undefined,
      defaultValue: () => (rp.props.name ? rp.props.value : undefined),
    });

    watch(
      [() => rp.props.name, () => rp.props.value],
      () => {
        if (!dirty) {
          const next = rp.props.value ?? '';
          selected.value = next;
          if (rp.props.name && rp.props.value !== undefined) {
            ctx.setFieldValue(
              formName,
              'RadioGroup',
              rp.props.name,
              next,
              false,
            );
          }
        }
      },
      { immediate: true },
    );

    const onValueChange = (next: string) => {
      dirty = true;
      selected.value = next;
      if (rp.props.name) {
        ctx.setFieldValue(formName, 'RadioGroup', rp.props.name, next, true);
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
      const usageHint = rp.props.usageHint ?? 'default';
      const rootClassName = `OpenUIRadioGroup OpenUIRadioGroup-${usageHint}`;

      return h('view', { class: rootClassName }, [
        h(RadioGroupRoot, {
          value: selected.value,
          onValueChange,
        }, {
          default: () => [
            h(
              'view',
              { class: 'OpenUIRadioGroupContainer' },
              rp.props.items.map((item) =>
                h('view', { key: item, class: 'OpenUIRadioOption' }, [
                  h(Radio, {
                    className: 'OpenUIRadioItem',
                    value: item,
                    radioProps: HitSlop,
                  }, {
                    default: () => [
                      h(RadioIndicator, {
                        className: 'OpenUIRadioIndicator',
                      }, {
                        default: () => [
                          h('view', {
                            class: 'OpenUIRadioIndicatorDot',
                          }),
                        ],
                      }),
                    ],
                  }),
                  h('text', { class: 'OpenUIRadioLabel' }, item),
                ])
              ),
            ),
          ],
        }),
      ]);
    };
  },
});

export const RadioGroup = defineComponent({
  name: 'RadioGroup',
  props: radioGroupPropsSchema,
  description:
    'Single-choice radio group. Visual state updates locally on tap; the action fires for the LLM to persist the change.',
  component: RadioGroupRenderer,
});
