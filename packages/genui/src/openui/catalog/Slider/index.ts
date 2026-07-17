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
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from '../../../shared/lynx-ui/index.js';
import {
  useFormName,
  useOpenUI,
  useSetDefaultValue,
} from '../../core/context.js';
import { defineComponent } from '../../core/library.js';
import { actionPropSchema } from '../Action/index.js';

import '../../../../styles/openui/catalog/Slider.css';

const CONTINUE_CONVERSATION_ACTION = String(
  BuiltinActionType.ContinueConversation,
);
const OPEN_URL_ACTION = String(BuiltinActionType.OpenUrl);

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;

const sliderPropsSchema = z.object({
  label: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  value: z.number().optional(),
  step: z.number().optional(),
  action: actionPropSchema.optional(),
  name: z.string().optional(),
});

type SliderProps = z.infer<typeof sliderPropsSchema>;

function toFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toRatio(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return (clamp(value, min, max) - min) / (max - min);
}

function fromRatio(
  ratio: number,
  min: number,
  max: number,
  step?: number,
): number {
  const range = max - min;
  if (range <= 0) return min;
  const raw = clamp(min + ratio * range, min, max);
  if (!step || step <= 0) return raw;
  return clamp(
    Number((min + Math.round((raw - min) / step) * step).toFixed(12)),
    min,
    max,
  );
}

const SliderRenderer = vueDefineComponent({
  name: 'OpenUISliderRenderer',
  props: ['props', 'renderNode', 'statementId', 'onAction'],
  setup(rp: { props: SliderProps }) {
    const ctx = useOpenUI();
    const formName = useFormName();

    const getRange = () => {
      const min = toFiniteNumber(rp.props.min, DEFAULT_MIN);
      const max = toFiniteNumber(rp.props.max, DEFAULT_MAX);
      return max > min
        ? { min, max }
        : { min: DEFAULT_MIN, max: DEFAULT_MAX };
    };

    const value = ref<number>(
      toFiniteNumber(rp.props.value, getRange().min),
    );
    let dirty = false;

    useSetDefaultValue({
      ...(formName ? { formName: () => formName } : {}),
      componentType: 'Slider',
      name: () => rp.props.name ?? '',
      existingValue: () =>
        rp.props.name
          ? ctx.getFieldValue(formName, rp.props.name)
          : undefined,
      defaultValue: () =>
        rp.props.name && rp.props.value !== undefined
          ? toFiniteNumber(rp.props.value, getRange().min)
          : undefined,
    });

    watch(
      [() => rp.props.name, () => rp.props.value],
      () => {
        if (!dirty) {
          const next = toFiniteNumber(rp.props.value, getRange().min);
          value.value = next;
          if (rp.props.name && rp.props.value !== undefined) {
            ctx.setFieldValue(formName, 'Slider', rp.props.name, next, false);
          }
        }
      },
      { immediate: true },
    );

    const onValueChange = (nextRatio: number) => {
      const range = getRange();
      const step = rp.props.step && rp.props.step > 0
        ? rp.props.step
        : undefined;
      const next = fromRatio(nextRatio, range.min, range.max, step);
      dirty = true;
      value.value = next;
      if (rp.props.name) {
        ctx.setFieldValue(formName, 'Slider', rp.props.name, next, true);
      }
      if (!rp.props.action) return;
      if ('steps' in rp.props.action) {
        void ctx.triggerAction(
          String(next),
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
      void ctx.triggerAction(String(next), formName, {
        type: actionType,
        params: actionParams,
      });
    };

    return (): VNodeChild => {
      const props = rp.props;
      const range = getRange();
      const step = props.step && props.step > 0 ? props.step : undefined;
      const stepProps = step
        ? { step: step / (range.max - range.min) }
        : {};
      const ratio = toRatio(value.value, range.min, range.max);

      return h('view', { class: 'OpenUISlider' }, [
        props.label
          ? h('view', { class: 'OpenUISliderHeader' }, [
            h('text', { class: 'OpenUISliderLabel' }, props.label),
            h(
              'text',
              { class: 'OpenUISliderValue' },
              String(Math.round(value.value)),
            ),
          ])
          : null,
        h('view', { class: 'OpenUISliderControl' }, [
          h(SliderRoot, {
            ...stepProps,
            className: 'OpenUISliderRoot',
            value: ratio,
            onValueChange,
          }, {
            default: () => [
              h(SliderTrack, { className: 'OpenUISliderTrack' }, {
                default: () => [
                  h(SliderIndicator, { className: 'OpenUISliderIndicator' }),
                  h(SliderThumb, { className: 'OpenUISliderThumb' }, {
                    default: () => [
                      h('view', { class: 'OpenUISliderThumbDot' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ]),
      ]);
    };
  },
});

export const Slider = defineComponent({
  name: 'Slider',
  props: sliderPropsSchema,
  description:
    'Continuous-value slider. Visual state updates locally during drag; the action fires for the LLM to persist the change.',
  component: SliderRenderer,
});
