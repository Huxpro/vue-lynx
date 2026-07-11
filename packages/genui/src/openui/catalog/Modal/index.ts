// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import {
  defineComponent as vueDefineComponent,
  h,
  provide,
  ref,
} from '@vue/runtime-core';
import type { SetupContext, VNodeChild } from '@vue/runtime-core';

import { OpenUIContextKey, useOpenUI } from '../../core/context.js';
import type { OpenUIContextValue } from '../../core/context.js';
import { defineComponent } from '../../core/library.js';
import { stringLikeSchema, stringifyValue } from '../utils.js';

import '../../../../styles/openui/catalog/Modal.css';

const modalPropsSchema = z.object({
  trigger: z.any(),
  content: z.any(),
  title: stringLikeSchema.optional(),
  closeOnAction: z.boolean().optional(),
});

type ModalProps = z.infer<typeof modalPropsSchema>;

/**
 * Provides an overridden OpenUI context to a subtree — the Vue analogue of
 * the upstream `<OpenUIContext.Provider value={...}>` wrappers inside Modal.
 */
const OpenUIContextOverride = vueDefineComponent({
  name: 'OpenUIContextOverride',
  props: ['value'],
  setup(
    props: { value: OpenUIContextValue },
    { slots }: SetupContext,
  ) {
    provide(OpenUIContextKey, props.value);
    return (): VNodeChild => slots['default']?.();
  },
});

const ModalRenderer = vueDefineComponent({
  name: 'OpenUIModalRenderer',
  props: ['props', 'renderNode', 'statementId', 'onAction'],
  setup(
    rp: { props: ModalProps; renderNode: (v: unknown) => VNodeChild },
  ) {
    const open = ref(false);
    const openUi = useOpenUI();

    const onOpen = () => {
      open.value = true;
    };
    const onClose = () => {
      open.value = false;
    };

    // Delegating contexts: all reads go to the live parent context; only
    // `triggerAction` is overridden (open on trigger action, close on
    // content action when `closeOnAction`).
    const withTriggerAction = (
      triggerAction: OpenUIContextValue['triggerAction'],
    ): OpenUIContextValue =>
      new Proxy(openUi, {
        get(target, key, receiver) {
          if (key === 'triggerAction') return triggerAction;
          return Reflect.get(target, key, receiver);
        },
      });

    const triggerContext = withTriggerAction(async (...args) => {
      await openUi.triggerAction(...args);
      open.value = true;
    });
    const contentContext = withTriggerAction(async (...args) => {
      await openUi.triggerAction(...args);
      if (rp.props.closeOnAction ?? true) {
        open.value = false;
      }
    });

    return (): VNodeChild => {
      const props = rp.props;
      const isStreaming = openUi.isStreaming;

      return h('view', { class: 'OpenUIModal' }, [
        h(OpenUIContextOverride, { value: triggerContext }, {
          default: () => [
            h(
              'view',
              {
                class: 'OpenUIModalTrigger',
                ...(isStreaming ? {} : { bindtap: onOpen }),
              },
              [rp.renderNode(props.trigger)],
            ),
          ],
        }),
        open.value
          ? h('view', { class: 'OpenUIModalMask' }, [
            h('view', { class: 'OpenUIModalContent' }, [
              h('view', { class: 'OpenUIModalHeader' }, [
                props.title
                  ? h(
                    'text',
                    { class: 'OpenUIModalTitle' },
                    stringifyValue(props.title),
                  )
                  : null,
                h(
                  'view',
                  {
                    class: 'OpenUIModalClose',
                    ...(isStreaming ? {} : { bindtap: onClose }),
                  },
                  [h('text', { class: 'OpenUIModalCloseText' }, 'x')],
                ),
              ]),
              h(OpenUIContextOverride, { value: contentContext }, {
                default: () => [
                  h('view', { class: 'OpenUIModalBody' }, [
                    rp.renderNode(props.content),
                  ]),
                ],
              }),
            ]),
          ])
          : null,
      ]);
    };
  },
});

export const Modal = defineComponent({
  name: 'Modal',
  props: modalPropsSchema,
  description: 'Tap-triggered modal container with custom content.',
  component: ModalRenderer,
});
