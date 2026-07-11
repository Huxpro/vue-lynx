// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { computed, defineComponent, h, ref, watch } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import {
  addMonths,
  buildDateTimeMonthPage,
  dateTimePartsToDate,
  formatDateTimeInputValue,
  getDateTimeInputPlaceholder,
  getDefaultDateTimeParts,
  getWeekdayLabels,
  incrementDateTimePart,
  isDateTimeAfterMax,
  isDateTimeBeforeMin,
  normalizeDateTimeInputLabel,
  normalizeDateTimeInputMode,
  normalizeDateTimeInputValue,
  startOfMonth,
  withDate,
} from './utils.js';
import { catalogProps } from '../shared.js';
import {
  DialogBackdrop,
  DialogContent,
  DialogRoot,
  DialogView,
} from '../../../shared/lynx-ui/index.js';
import type { GenUIComponent } from '../../vue/component.js';
import { useChecks } from '../../vue/useChecks.js';
import type { CheckLike } from '../../vue/useChecks.js';
import type { GenericComponentProps } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/DateTimeInput.css';

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatMonthCaption(month: Date): string {
  return `${MONTH_LABELS[month.getMonth()]} ${month.getFullYear()}`;
}

function joinClassNames(values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function getPartsKey(parts: ReturnType<typeof normalizeDateTimeInputValue>) {
  return parts
    ? formatDateTimeInputValue(
      parts,
      'YYYY-MM-DD HH:mm',
      { enableDate: true, enableTime: true },
    )
    : '';
}

/**
 * Props for the built-in DateTimeInput catalog component.
 *
 * @a2uiCatalog DateTimeInput
 */
export interface DateTimeInputProps extends GenericComponentProps {
  /** The current date/time value. Typically bound to a data path. */
  value: string | { path: string };
  /** The text label for the input field. */
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
  /** Whether to show the date picker. */
  enableDate?: boolean;
  /** Whether to show the time picker. */
  enableTime?: boolean;
  /** Format string for the output value. Supports YYYY, MM, DD, HH, and mm. */
  outputFormat?: string;
  /** Minimum allowed date/time value. */
  min?: string;
  /** Maximum allowed date/time value. */
  max?: string;
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
 * Render a local date and/or time picker backed by the surface data model.
 */
export const DateTimeInput: GenUIComponent = defineComponent({
  name: 'DateTimeInput',
  props: catalogProps(
    'value',
    'label',
    'enableDate',
    'enableTime',
    'outputFormat',
    'min',
    'max',
    'checks',
  ),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as DateTimeInputProps;

    const valueParts = computed(() =>
      normalizeDateTimeInputValue(props.value)
    );
    const valueKey = computed(() => getPartsKey(valueParts.value));
    const initialParts = valueParts.value ?? getDefaultDateTimeParts();
    const open = ref(false);
    const draftParts = ref(initialParts);
    const visibleMonth = ref(startOfMonth(dateTimePartsToDate(initialParts)));

    const { outcome, firstFailureMessage } = useChecks({
      checks: () => props.checks as CheckLike[] | undefined,
      componentId: () => props.id ?? '',
      surface: () => props.surface,
      dataContextPath: () => props.dataContextPath,
    });

    watch([open, valueKey], () => {
      if (open.value) return;
      const nextParts = valueParts.value ?? getDefaultDateTimeParts();
      draftParts.value = nextParts;
      visibleMonth.value = startOfMonth(dateTimePartsToDate(nextParts));
    });

    return (): VNodeChild => {
      const { label, max, min, outputFormat, setValue } = props;
      const mode = normalizeDateTimeInputMode(
        props.enableDate,
        props.enableTime,
      );
      const minParts = normalizeDateTimeInputValue(min);
      const maxParts = normalizeDateTimeInputValue(max);

      const minDate = minParts ? dateTimePartsToDate(minParts) : null;
      const maxDate = maxParts ? dateTimePartsToDate(maxParts) : null;
      const draftDate = dateTimePartsToDate(draftParts.value);
      const monthPage = buildDateTimeMonthPage({
        month: visibleMonth.value,
        selectedDate: draftDate,
        today: new Date(),
        minDate,
        maxDate,
      });
      const weekdayLabels = getWeekdayLabels();
      const draftOutOfRange =
        isDateTimeBeforeMin(draftParts.value, minParts)
        || isDateTimeAfterMax(draftParts.value, maxParts);
      const currentOutOfRange = valueParts.value
        ? isDateTimeBeforeMin(valueParts.value, minParts)
          || isDateTimeAfterMax(valueParts.value, maxParts)
        : false;
      const ok = outcome.value.ok;
      const invalid = !ok || currentOutOfRange;
      const labelText = normalizeDateTimeInputLabel(label);
      const displayValue = valueParts.value
        ? formatDateTimeInputValue(valueParts.value, outputFormat, mode)
        : getDateTimeInputPlaceholder(mode);

      const handleOpen = () => {
        const nextParts = valueParts.value ?? draftParts.value
          ?? getDefaultDateTimeParts();
        draftParts.value = nextParts;
        visibleMonth.value = startOfMonth(dateTimePartsToDate(nextParts));
        open.value = true;
      };

      const handleCancel = () => {
        open.value = false;
      };

      const handleConfirm = () => {
        if (draftOutOfRange) return;
        setValue?.(
          'value',
          formatDateTimeInputValue(draftParts.value, outputFormat, mode),
        );
        open.value = false;
      };

      const handlePreviousMonth = () => {
        visibleMonth.value = addMonths(visibleMonth.value, -1);
      };

      const handleNextMonth = () => {
        visibleMonth.value = addMonths(visibleMonth.value, 1);
      };

      const handleTimeStep = (part: 'hour' | 'minute', delta: number) => {
        draftParts.value = incrementDateTimePart(
          draftParts.value,
          part,
          delta,
        );
      };

      const rootClassName = joinClassNames([
        'datetime-input',
        invalid && 'datetime-input-invalid',
      ]);

      return h('view', { class: rootClassName }, [
        labelText
          ? h('text', { class: 'datetime-input-label' }, labelText)
          : null,
        h(
          'view',
          {
            class: joinClassNames([
              'datetime-input-control',
              !valueParts.value && 'datetime-input-control-placeholder',
            ]),
            bindtap: handleOpen,
            'event-through': false,
          },
          [
            h('text', { class: 'datetime-input-value' }, displayValue),
            h('text', { class: 'datetime-input-icon' }, 'calendar_today'),
          ],
        ),
        invalid && firstFailureMessage.value
          ? h(
            'text',
            { class: 'datetime-input-error' },
            firstFailureMessage.value,
          )
          : null,
        currentOutOfRange
          ? h(
            'text',
            { class: 'datetime-input-error' },
            'Date is out of range',
          )
          : null,
        h(DialogRoot, {
          show: open.value,
          onShowChange: (nextOpen: boolean) => {
            open.value = nextOpen;
          },
        }, {
          default: () => [
            h(DialogView, {
              className: 'datetime-dialog-view',
              overlayLevel: 4,
            }, {
              default: () => [
                h(DialogBackdrop, {
                  className: 'datetime-dialog-backdrop',
                  clickToClose: true,
                  transition: true,
                }),
                h(DialogContent, {
                  className: 'datetime-dialog-content',
                  transition: true,
                }, {
                  default: () => [
                    mode.enableDate
                      ? h('view', { class: 'datetime-calendar' }, [
                        h('view', { class: 'datetime-calendar-header' }, [
                          h(
                            'view',
                            {
                              class: 'datetime-calendar-nav',
                              bindtap: handlePreviousMonth,
                              'event-through': false,
                            },
                            [
                              h(
                                'text',
                                { class: 'datetime-calendar-nav-icon' },
                                'chevron_left',
                              ),
                            ],
                          ),
                          h(
                            'text',
                            { class: 'datetime-calendar-caption' },
                            formatMonthCaption(visibleMonth.value),
                          ),
                          h(
                            'view',
                            {
                              class: 'datetime-calendar-nav',
                              bindtap: handleNextMonth,
                              'event-through': false,
                            },
                            [
                              h(
                                'text',
                                { class: 'datetime-calendar-nav-icon' },
                                'chevron_right',
                              ),
                            ],
                          ),
                        ]),
                        h(
                          'view',
                          { class: 'datetime-weekdays' },
                          weekdayLabels.map((weekday, weekdayIndex) =>
                            h(
                              'view',
                              {
                                key: weekdayIndex,
                                class: 'datetime-weekday',
                              },
                              [
                                h(
                                  'text',
                                  { class: 'datetime-weekday-text' },
                                  weekday,
                                ),
                              ],
                            )
                          ),
                        ),
                        h(
                          'view',
                          { class: 'datetime-month' },
                          monthPage.days.map((day, dayIndex) =>
                            h(
                              'view',
                              {
                                key: dayIndex,
                                class: joinClassNames([
                                  'datetime-day',
                                  day.outside && 'datetime-day-outside',
                                  day.selected && 'datetime-day-selected',
                                  day.today && 'datetime-day-today',
                                  day.disabled && 'datetime-day-disabled',
                                ]),
                                bindtap: () => {
                                  if (day.disabled) return;
                                  draftParts.value = withDate(
                                    draftParts.value,
                                    day.date,
                                  );
                                  if (day.outside) {
                                    visibleMonth.value = startOfMonth(
                                      day.date,
                                    );
                                  }
                                },
                                'event-through': false,
                              },
                              [
                                h(
                                  'text',
                                  { class: 'datetime-day-text' },
                                  String(day.day),
                                ),
                              ],
                            )
                          ),
                        ),
                      ])
                      : null,
                    mode.enableTime
                      ? h('view', { class: 'datetime-time' }, [
                        h('text', { class: 'datetime-time-label' }, 'Time'),
                        h('view', { class: 'datetime-time-fields' }, [
                          h('view', { class: 'datetime-time-field' }, [
                            h(
                              'view',
                              {
                                class: 'datetime-time-stepper',
                                bindtap: () => handleTimeStep('hour', 1),
                                'event-through': false,
                              },
                              [
                                h(
                                  'text',
                                  { class: 'datetime-time-stepper-icon' },
                                  'expand_less',
                                ),
                              ],
                            ),
                            h(
                              'text',
                              { class: 'datetime-time-value' },
                              String(draftParts.value.hour).padStart(2, '0'),
                            ),
                            h(
                              'view',
                              {
                                class: 'datetime-time-stepper',
                                bindtap: () => handleTimeStep('hour', -1),
                                'event-through': false,
                              },
                              [
                                h(
                                  'text',
                                  { class: 'datetime-time-stepper-icon' },
                                  'expand_more',
                                ),
                              ],
                            ),
                          ]),
                          h(
                            'text',
                            { class: 'datetime-time-separator' },
                            ':',
                          ),
                          h('view', { class: 'datetime-time-field' }, [
                            h(
                              'view',
                              {
                                class: 'datetime-time-stepper',
                                bindtap: () => handleTimeStep('minute', 1),
                                'event-through': false,
                              },
                              [
                                h(
                                  'text',
                                  { class: 'datetime-time-stepper-icon' },
                                  'expand_less',
                                ),
                              ],
                            ),
                            h(
                              'text',
                              { class: 'datetime-time-value' },
                              String(draftParts.value.minute).padStart(2, '0'),
                            ),
                            h(
                              'view',
                              {
                                class: 'datetime-time-stepper',
                                bindtap: () => handleTimeStep('minute', -1),
                                'event-through': false,
                              },
                              [
                                h(
                                  'text',
                                  { class: 'datetime-time-stepper-icon' },
                                  'expand_more',
                                ),
                              ],
                            ),
                          ]),
                        ]),
                      ])
                      : null,
                    draftOutOfRange
                      ? h(
                        'text',
                        { class: 'datetime-dialog-error' },
                        'Date is out of range',
                      )
                      : null,
                    h('view', { class: 'datetime-dialog-actions' }, [
                      h(
                        'view',
                        {
                          class:
                            'datetime-dialog-button datetime-dialog-button-secondary',
                          bindtap: handleCancel,
                          'event-through': false,
                        },
                        [
                          h(
                            'text',
                            { class: 'datetime-dialog-button-text-secondary' },
                            'Cancel',
                          ),
                        ],
                      ),
                      h(
                        'view',
                        {
                          class: joinClassNames([
                            'datetime-dialog-button',
                            'datetime-dialog-button-primary',
                            draftOutOfRange
                              && 'datetime-dialog-button-disabled',
                          ]),
                          bindtap: handleConfirm,
                          'event-through': false,
                        },
                        [
                          h(
                            'text',
                            { class: 'datetime-dialog-button-text-primary' },
                            'Done',
                          ),
                        ],
                      ),
                    ]),
                  ],
                }),
              ],
            }),
          ],
        }),
      ]);
    };
  },
});
