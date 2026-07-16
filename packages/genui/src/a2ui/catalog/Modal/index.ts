// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h, ref } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import {
  DialogBackdrop,
  DialogContent,
  DialogRoot,
  DialogView,
} from '../../../shared/lynx-ui/index.js';
import { NodeRenderer } from '../../vue/A2UIRenderer.js';
import type { GenUIComponent } from '../../vue/component.js';
import type {
  ComponentInstance,
  GenericComponentProps,
} from '../../store/types.js';

import '../../../../styles/a2ui/catalog/Modal.css';

/**
 * Props for the built-in Modal catalog component.
 *
 * @a2uiCatalog Modal
 */
export interface ModalProps extends GenericComponentProps {
  /** The ID of the component that opens the modal when interacted with. */
  trigger: string;
  /** The ID of the component to display inside the modal. */
  content: string;
}

function childWithContext(
  child: ComponentInstance | undefined,
  dataContextPath: string | undefined,
): ComponentInstance | undefined {
  return child && dataContextPath
    ? { ...child, dataContextPath }
    : child;
}

/**
 * Render a trigger component and a locally opened modal content component.
 */
export const Modal: GenUIComponent = defineComponent({
  name: 'Modal',
  props: catalogProps('trigger', 'content', 'entryPointChild', 'contentChild'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as ModalProps;
    const open = ref(false);

    return (): VNodeChild => {
      const { dataContextPath, surface } = props;

      const compatibleProps = props as ModalProps & {
        contentChild?: string;
        entryPointChild?: string;
      };
      const triggerId = compatibleProps.trigger
        ?? compatibleProps.entryPointChild;
      const contentId = compatibleProps.content
        ?? compatibleProps.contentChild;

      const trigger = childWithContext(
        triggerId ? surface.components.get(triggerId) : undefined,
        dataContextPath,
      );
      const content = childWithContext(
        contentId ? surface.components.get(contentId) : undefined,
        dataContextPath,
      );

      const handleOpen = () => {
        open.value = true;
      };

      return h(DialogRoot, {
        show: open.value,
        onShowChange: (nextOpen: boolean) => {
          open.value = nextOpen;
        },
      }, {
        default: () => [
          h('view', { class: 'modal-trigger', bindtap: handleOpen }, [
            trigger
              ? h(NodeRenderer, {
                component: trigger,
                surface,
                suppressActionDispatch: true,
              })
              : null,
          ]),
          h(DialogView, { className: 'modal-view', overlayLevel: 4 }, {
            default: () => [
              h(DialogBackdrop, {
                className: 'modal-backdrop',
                clickToClose: true,
                transition: true,
              }),
              h(DialogContent, {
                className: 'modal-content',
                transition: true,
              }, {
                default: () => [
                  content
                    ? h(NodeRenderer, { component: content, surface })
                    : null,
                ],
              }),
            ],
          }),
        ],
      });
    };
  },
});
