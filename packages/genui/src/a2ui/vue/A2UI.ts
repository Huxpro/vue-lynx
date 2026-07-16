// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  defineComponent,
  h,
  onScopeDispose,
  shallowRef,
  watch,
} from '@vue/runtime-core';
import type { PropType, VNodeChild } from '@vue/runtime-core';

import { A2UIRenderer } from './A2UIRenderer.js';
import type { UnsupportedInfo } from './A2UIRenderer.js';
import type { GenUIComponent } from './component.js';
import { provideA2UIContext } from './context.js';
import type { Catalog, CatalogInput } from '../catalog/defineCatalog.js';
import { defineCatalog } from '../catalog/defineCatalog.js';
import { MessageProcessor } from '../store/MessageProcessor.js';
import type { MessageStore } from '../store/MessageStore.js';
import { createResource } from '../store/Resource.js';
import type {
  Resource,
  ResourceInfo,
  UserActionPayload,
} from '../store/types.js';

/**
 * Props for the all-in-one A2UI Vue Lynx renderer.
 *
 * Render overrides are available both as function props (upstream parity)
 * and as slots (Vue idiom): `#empty`, `#fallback`, `#error="{ error }"`,
 * `#unsupported="{ info }"`, and `#surface="{ children, surfaceId }"`
 * (the slot analogue of `wrapSurface`). Slots win over function props.
 */
export interface A2UIProps {
  /**
   * The raw-message buffer the developer pushes protocol messages into.
   * `<A2UI>` subscribes and processes new messages incrementally.
   *
   * The internal `MessageProcessor` (surfaces, signals, resources) is
   * created once per mount and is **not reset** if `messageStore` is
   * later replaced with a different instance. Pass a `key` derived from
   * the store's identity if you want a fresh session, e.g.
   * `<A2UI :key="turnId" :message-store="turnStore" ... />`.
   */
  messageStore: MessageStore;
  /**
   * Components the renderer is allowed to instantiate. Each item is either
   * a bare component (name read from `displayName ?? name`) or a tuple
   * `[component, manifest]` where the manifest is the JSON the extractor
   * emits at `dist/catalog/<Name>/catalog.json`.
   */
  catalogs: readonly CatalogInput[];
  /**
   * Called when a user action fires inside the rendered tree (button
   * tap, etc.). Forward to your agent and push the response messages
   * back into the same `messageStore` to update the UI. Fire-and-forget;
   * the renderer never awaits this.
   */
  onAction?: (action: UserActionPayload) => void;
  /**
   * Optional class name applied to the top-level `surface-${surfaceId}`
   * view for the active surface.
   */
  className?: string;
  /** Wrap each top-level surface (function-prop form of the `surface` slot). */
  wrapSurface?: (
    children: VNodeChild,
    ctx: { surfaceId: string },
  ) => VNodeChild;
  /** Render before the first `beginRendering` arrives from the buffer. */
  renderEmpty?: () => VNodeChild;
  /** Render while the active resource is pending. */
  renderFallback?: () => VNodeChild;
  /** Render when the active resource fails. */
  renderError?: (err: unknown) => VNodeChild;
  /** Render when unsupported data syntax or an unsupported component is encountered. */
  renderUnsupported?: (info: UnsupportedInfo) => VNodeChild;
}

interface InternalSession {
  processor: MessageProcessor;
  resources: Map<string, Resource>;
  /** How many messages from the buffer have been processed so far. */
  processedCount: number;
}

/**
 * The all-in-one A2UI component. Owns a `MessageProcessor` internally,
 * processes raw messages from the buffer, and renders the most recent
 * `beginRendering` surface tree.
 *
 * @example
 * const store = createMessageStore();
 *
 * // Developer's IO module pushes raw messages into the store.
 * async function streamFromAgent(input: string) {
 *   for await (const msg of myAgent.stream(input)) store.push(msg);
 * }
 *
 * <A2UI
 *   :message-store="store"
 *   :catalogs="[Text, Button, [Card, cardManifest]]"
 *   :on-action="(action) => { streamFromAgent(serializeAction(action)); }"
 * />
 */
export const A2UI: GenUIComponent = defineComponent({
  name: 'A2UI',
  props: {
    messageStore: {
      type: Object as PropType<MessageStore>,
      required: true,
    },
    catalogs: {
      type: Array as PropType<readonly CatalogInput[]>,
      required: true,
    },
    onAction: {
      type: Function as PropType<(action: UserActionPayload) => void>,
      default: undefined,
    },
    className: { type: String, default: undefined },
    wrapSurface: {
      type: Function as PropType<
        (children: VNodeChild, ctx: { surfaceId: string }) => VNodeChild
      >,
      default: undefined,
    },
    renderEmpty: {
      type: Function as PropType<() => VNodeChild>,
      default: undefined,
    },
    renderFallback: {
      type: Function as PropType<() => VNodeChild>,
      default: undefined,
    },
    renderError: {
      type: Function as PropType<(err: unknown) => VNodeChild>,
      default: undefined,
    },
    renderUnsupported: {
      type: Function as PropType<(info: UnsupportedInfo) => VNodeChild>,
      default: undefined,
    },
  },
  setup(props: A2UIProps, { slots }: { slots: Record<string, unknown> }) {
    // Per-instance session. Created once; mutated as messages arrive.
    const session: InternalSession = {
      processor: new MessageProcessor(),
      resources: new Map(),
      processedCount: 0,
    };

    // Reactive pointer to the resource of the most recent `beginRendering`
    // (upstream used a forceUpdate reducer + mutable activeMessageId).
    const activeMessageId = shallowRef<string | null>(null);
    // Bumped on `deleteSurface` so the root re-renders even when the
    // active-resource pointer is unchanged.
    const version = shallowRef(0);

    // Wiring of processor → resource bookkeeping + onAction dispatch.
    // Registered before the first processMessages call below.
    const offUpdate = session.processor.onUpdate((data) => {
      const { type, surfaceId, messageId } = data as {
        type: string;
        surfaceId: string;
        messageId: string;
        targetId?: string;
      };
      const surface = session.processor.getOrCreateSurface(surfaceId);

      if (type === 'beginRendering') {
        let resource = session.resources.get(messageId);
        if (!resource) {
          resource = createResource<ResourceInfo>(messageId);
          session.resources.set(messageId, resource);
        }
        resource.complete({ type: 'beginRendering', surfaceId, surface });
        activeMessageId.value = messageId;
        version.value++;
      } else if (type === 'surfaceUpdate') {
        const updates =
          (data as { updates?: ReadonlyArray<{ id?: string }> }).updates ?? [];
        for (const update of updates) {
          if (!update.id) continue;
          const r = surface.resources.get(update.id);
          r?.complete({
            type: 'surfaceUpdate',
            surfaceId,
            surface,
            component: update as ResourceInfo['component'] & object,
          } as ResourceInfo);
        }
      } else if (type === 'deleteSurface') {
        const targetId = (data as { targetId?: string }).targetId
          ?? surface.rootComponentId;
        if (targetId && surface.resources.has(targetId)) {
          surface.resources.get(targetId)!.complete({
            type: 'deleteSurface',
            surfaceId,
            surface,
          });
        }
        version.value++;
      }
    });

    const offEvent = session.processor.onEvent(({ message, resolve }) => {
      // Empty resolve — there is no "response" channel from the renderer
      // back into the protocol. Responses arrive via the buffer.
      resolve([]);
      if (
        typeof message === 'object' && message !== null
        && 'userAction' in message
        && (message as { userAction: unknown }).userAction
      ) {
        const action =
          (message as { userAction: UserActionPayload }).userAction;
        try {
          props.onAction?.(action);
        } catch (e) {
          console.error('[a2ui] onAction handler threw:', e);
        }
      }
    });

    onScopeDispose(() => {
      offUpdate();
      offEvent();
    });

    // Subscribe to the developer's raw buffer and process new messages.
    const messages = shallowRef(props.messageStore.getSnapshot());
    watch(
      () => props.messageStore,
      (store, _prev, onCleanup) => {
        messages.value = store.getSnapshot();
        onCleanup(store.subscribe(() => {
          messages.value = store.getSnapshot();
        }));
      },
      { immediate: true },
    );

    watch(
      messages,
      (list) => {
        if (list.length === session.processedCount) return;
        const slice = list.slice(session.processedCount);
        session.processedCount = list.length;
        if (slice.length > 0) {
          session.processor.processMessages(slice);
        }
      },
      { immediate: true },
    );

    provideA2UIContext(
      session.processor,
      (): Catalog => defineCatalog(props.catalogs),
    );

    const typedSlots = slots as {
      empty?: () => VNodeChild;
      fallback?: () => VNodeChild;
      error?: (scope: { error: unknown }) => VNodeChild;
      unsupported?: (scope: { info: UnsupportedInfo }) => VNodeChild;
      surface?: (
        scope: { children: VNodeChild; surfaceId: string },
      ) => VNodeChild;
    };

    return (): VNodeChild => {
      void version.value;

      const activeResource = activeMessageId.value
        ? (session.resources.get(activeMessageId.value) ?? null)
        : null;

      if (!activeResource) {
        if (typedSlots.empty) return typedSlots.empty();
        return props.renderEmpty?.() ?? null;
      }

      const rendererProps: Record<string, unknown> = {
        resource: activeResource,
      };
      if (props.className !== undefined) {
        rendererProps['className'] = props.className;
      }
      const wrapSurface = typedSlots.surface
        ? (children: VNodeChild, ctx: { surfaceId: string }) =>
          typedSlots.surface!({ children, surfaceId: ctx.surfaceId })
        : props.wrapSurface;
      if (wrapSurface) rendererProps['wrapSurface'] = wrapSurface;
      const renderFallback = typedSlots.fallback ?? props.renderFallback;
      if (renderFallback) rendererProps['renderFallback'] = renderFallback;
      const renderError = typedSlots.error
        ? (error: unknown) => typedSlots.error!({ error })
        : props.renderError;
      if (renderError) rendererProps['renderError'] = renderError;
      const renderUnsupported = typedSlots.unsupported
        ? (info: UnsupportedInfo) => typedSlots.unsupported!({ info })
        : props.renderUnsupported;
      if (renderUnsupported) {
        rendererProps['renderUnsupported'] = renderUnsupported;
      }

      return h(A2UIRenderer, rendererProps);
    };
  },
});
