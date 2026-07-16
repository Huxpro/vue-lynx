// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import { A2UIRenderer } from '../../vue/A2UIRenderer.js';
import type { GenUIComponent } from '../../vue/component.js';
import { useChecks } from '../../vue/useChecks.js';
import type { CheckLike } from '../../vue/useChecks.js';
import type { GenericComponentProps } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/Button.css';

/**
 * Props for the built-in Button catalog component.
 *
 * @a2uiCatalog Button
 */
export interface ButtonProps extends GenericComponentProps {
  child: string;
  variant?: 'primary' | 'borderless';
  isValid?: boolean;
  /** v0.9 actions should use the `event` wrapper for server-dispatched clicks. */
  action: {
    event: {
      name: string;
      /** Context is a JSON object map in v0.9. */
      context?: Record<string, unknown>;
    };
  } | {
    functionCall: {
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
  };
  checks?: Array<{
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
    message: string;
  }>;
}

/**
 * Render an interactive button that dispatches an A2UI event or function call.
 */
export const Button: GenUIComponent = defineComponent({
  name: 'Button',
  props: catalogProps('child', 'variant', 'isValid', 'action', 'checks'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as ButtonProps;

    const { outcome, firstFailureMessage } = useChecks({
      checks: () => props.checks as CheckLike[] | undefined,
      componentId: () => props.id ?? '',
      surface: () => props.surface,
      dataContextPath: () => props.dataContextPath,
    });

    return (): VNodeChild => {
      const {
        action,
        child,
        isValid = true,
        surface,
        sendAction,
        variant = 'primary',
      } = props;
      const ok = outcome.value.ok;

      // The button is interactive only when both gates pass: `isValid` (the
      // agent's imperative "disabled" signal) and `ok` (the data-driven
      // result of evaluating the `checks` array).
      const enabled = isValid && ok;

      const handleClick = () => {
        if (enabled && action) {
          void sendAction?.(action as Record<string, unknown>);
        }
      };

      const childResource = child
        ? surface.resources.get(child)
        : undefined;

      return [
        h(
          'view',
          {
            class: `button button-${variant}${
              isValid ? '' : ' button-disabled'
            }${ok ? '' : ' button-invalid'}`,
            bindtap: enabled ? handleClick : undefined,
          },
          [
            childResource
              ? h(A2UIRenderer, { resource: childResource })
              : h('text', { class: 'button-fallback' }, 'Button'),
          ],
        ),
        !ok && firstFailureMessage.value
          ? h('text', { class: 'button-error' }, firstFailureMessage.value)
          : null,
      ];
    };
  },
});
