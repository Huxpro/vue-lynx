// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h, ref } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import {
  fromSliderRatio,
  normalizeSliderLabel,
  normalizeSliderNumber,
  normalizeSliderRange,
  toSliderRatio,
  toSliderStepRatio,
} from './utils.js';
import { catalogProps } from '../shared.js';
import {
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from '../../../shared/lynx-ui/index.js';
import type { GenUIComponent } from '../../vue/component.js';
import { useChecks } from '../../vue/useChecks.js';
import type { CheckLike } from '../../vue/useChecks.js';
import type { GenericComponentProps } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/Slider.css';

/**
 * Props for the built-in Slider catalog component.
 *
 * @a2uiCatalog Slider
 */
export interface SliderProps extends GenericComponentProps {
  /** The label for the slider. */
  label?: string | { path: string } | {
    call: string;
    args: Record<string, unknown>;
    returnType?:
      | 'string'
      | 'number'
      | 'boolean'
      | 'array'
      | 'object'
      | 'any'
      | 'void';
  };
  /** The minimum value of the slider. */
  min?: number;
  /** The maximum value of the slider. */
  max: number;
  /** The current value of the slider. */
  value: number | { path: string } | {
    call: string;
    args: Record<string, unknown>;
    returnType?:
      | 'string'
      | 'number'
      | 'boolean'
      | 'array'
      | 'object'
      | 'any'
      | 'void';
  };
  /** A list of checks to perform. */
  checks?: Array<{
    /** The condition that indicates whether the check passes. */
    condition: boolean | { path: string } | {
      call: string;
      args: Record<string, unknown>;
      returnType?:
        | 'string'
        | 'number'
        | 'boolean'
        | 'array'
        | 'object'
        | 'any'
        | 'void';
    };
    /** The error message to display if the check fails. */
    message: string;
  }>;
}

/**
 * Render a numeric slider bound to the surface data model.
 */
export const Slider: GenUIComponent = defineComponent({
  name: 'Slider',
  props: catalogProps(
    'label',
    'min',
    'max',
    'value',
    'checks',
    'minValue',
    'maxValue',
    'step',
  ),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as SliderProps;

    const initialRange = normalizeSliderRange(
      props.min ?? (rawProps as Record<string, unknown>)['minValue'],
      props.max ?? (rawProps as Record<string, unknown>)['maxValue'],
    );
    const initialStep = normalizeSliderNumber(
      (rawProps as Record<string, unknown>)['step'],
      Number.NaN,
    );
    const displayValue = ref<number>(
      Math.round(fromSliderRatio(
        toSliderRatio(props.value, initialRange),
        initialRange,
        initialStep,
      )),
    );

    const { outcome, firstFailureMessage } = useChecks({
      checks: () => props.checks as CheckLike[] | undefined,
      componentId: () => props.id ?? '',
      surface: () => props.surface,
      dataContextPath: () => props.dataContextPath,
    });

    return (): VNodeChild => {
      const { label, max, min, setValue } = props;
      const raw = rawProps as Record<string, unknown>;
      const minValue = min ?? raw['minValue'];
      const maxValue = max ?? raw['maxValue'];
      const range = normalizeSliderRange(minValue, maxValue);
      const step = normalizeSliderNumber(raw['step'], Number.NaN);
      const stepRatio = toSliderStepRatio(step, range);
      const stepProps = stepRatio === undefined ? {} : { step: stepRatio };
      const ratio = toSliderRatio(props.value, range);
      const labelText = normalizeSliderLabel(label);
      const ok = outcome.value.ok;

      const handleValueChange = (nextRatio: number) => {
        const nextValue = fromSliderRatio(nextRatio, range, step);
        setValue?.('value', nextValue);
        displayValue.value = Math.round(nextValue);
      };

      return h(
        'view',
        { class: `slider${ok ? '' : ' slider-invalid'}` },
        [
          labelText
            ? h('view', { class: 'slider-header' }, [
              h('text', { class: 'slider-label' }, labelText),
              h('text', { class: 'slider-value' }, String(displayValue.value)),
            ])
            : null,
          h('view', { class: 'slider-control' }, [
            h(SliderRoot, {
              ...stepProps,
              className: 'slider-root',
              value: ratio,
              onValueChange: handleValueChange,
            }, {
              default: () => [
                h(SliderTrack, { className: 'slider-track' }, {
                  default: () => [
                    h(SliderIndicator, { className: 'slider-indicator' }),
                    h(SliderThumb, { className: 'slider-thumb' }, {
                      default: () => [
                        h('view', { class: 'slider-thumb-dot' }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ]),
          !ok && firstFailureMessage.value
            ? h('text', { class: 'slider-error' }, firstFailureMessage.value)
            : null,
        ],
      );
    };
  },
});
