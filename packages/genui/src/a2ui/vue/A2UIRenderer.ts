// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  computed,
  defineComponent,
  h,
  watchEffect,
} from '@vue/runtime-core';
import type { PropType, VNodeChild } from '@vue/runtime-core';

import type { GenUIComponent } from './component.js';
import { useA2UIContext, useCatalog } from './context.js';
import { useAction } from './useAction.js';
import { splitUnsupportedProps, useResolvedProps } from './useDataBinding.js';
import { useExternalStoreFrom } from '../../shared/useExternalStore.js';
import { Loading } from '../catalog/Loading/index.js';
import type {
  ComponentInstance,
  Resource,
  ResourceInfo,
  Surface,
} from '../store/types.js';

const warnedTags = new Set<string>();

/**
 * Details passed to unsupported-content renderers when the protocol stream
 * references syntax or catalog entries the renderer cannot handle.
 */
export interface UnsupportedInfo {
  id: string;
  tag: string;
  kind: 'component' | 'syntax';
  fields?: string[];
}

function defaultLoading(): VNodeChild {
  return h(Loading, { variant: 'block' });
}

function defaultUnsupportedNotice(props: UnsupportedInfo): VNodeChild {
  return h(
    'view',
    {
      style: {
        width: '100%',
        minHeight: '20px',
        marginBottom: '8px',
        padding: '6px',
        borderRadius: '6px',
        border: '1px dashed var(--a2ui-color-border)',
        backgroundColor: 'var(--a2ui-color-surface-muted)',
        color: 'var(--a2ui-color-text-muted)',
      },
    },
    [
      h(
        'text',
        { style: { color: 'inherit', fontSize: '10px', lineHeight: '12px' } },
        `Unsupported ${props.kind} in ${props.id}`,
      ),
    ],
  );
}

function buildNodeRecursive(
  component: ComponentInstance,
  surface: Surface,
  catalog: ReadonlyMap<string, GenUIComponent>,
  renderUnsupported: ((info: UnsupportedInfo) => VNodeChild) | undefined,
  props?: Record<string, unknown>,
  setValue?: (key: string, value: unknown) => void,
  sendAction?: (action: Record<string, unknown>) => void,
  suppressActionDispatch = false,
): VNodeChild {
  const tag = component.component;
  const Component = catalog.get(tag);
  const renderUnsupportedNotice = (info: UnsupportedInfo): VNodeChild => {
    if (typeof renderUnsupported === 'function') {
      return renderUnsupported(info);
    }
    return defaultUnsupportedNotice(info);
  };
  if (!Component) {
    return renderUnsupportedNotice({
      id: component.id ?? '',
      tag,
      kind: 'component',
    });
  }
  const { unsupportedFields, displayProps } = splitUnsupportedProps(props);
  return [
    unsupportedFields.length > 0
      ? renderUnsupportedNotice({
        id: component.id ?? '',
        tag,
        kind: 'syntax',
        fields: unsupportedFields,
      })
      : null,
    h(Component, {
      // Spread first so any data-binding key that collides with internal
      // plumbing (`surface`, `setValue`, `sendAction`, `id`,
      // `dataContextPath`) is overwritten by the explicit props below
      // rather than silently shadowing them.
      ...displayProps,
      key: component.id,
      id: component.id ?? '',
      surface,
      setValue,
      sendAction: suppressActionDispatch
        ? undefined
        : (a: Record<string, unknown>) => {
          void sendAction?.(a);
        },
      dataContextPath: component.dataContextPath,
    }),
  ];
}

/**
 * Props for the internal resource renderer used by catalog components to
 * render child component ids.
 *
 * @internal
 */
export interface A2UIRendererProps {
  resource: Resource;
  /** Optional class name applied to the top-level surface view. */
  className?: string;
  renderFallback?: () => VNodeChild;
  renderError?: (e: unknown) => VNodeChild;
  renderUnsupported?: (info: UnsupportedInfo) => VNodeChild;
  /**
   * Wrap each top-level surface so consumers can apply an outer theme
   * shell, wrapper className, or additional styles. The default does not
   * wrap — that is intentional, the renderer is headless.
   */
  wrapSurface?: (
    children: VNodeChild,
    ctx: { surfaceId: string },
  ) => VNodeChild;
}

export const A2UIRenderer: GenUIComponent = defineComponent({
  name: 'A2UIRenderer',
  props: {
    resource: { type: Object as PropType<Resource>, required: true },
    className: { type: String, default: 'surface-root' },
    renderFallback: {
      type: Function as PropType<() => VNodeChild>,
      default: undefined,
    },
    renderError: {
      type: Function as PropType<(e: unknown) => VNodeChild>,
      default: undefined,
    },
    renderUnsupported: {
      type: Function as PropType<(info: UnsupportedInfo) => VNodeChild>,
      default: undefined,
    },
    wrapSurface: {
      type: Function as PropType<
        (children: VNodeChild, ctx: { surfaceId: string }) => VNodeChild
      >,
      default: undefined,
    },
  },
  setup(props: A2UIRendererProps & { className: string }) {
    // Eagerly read context so the renderer fails clearly outside `<A2UI>`.
    useCatalog();

    const snapshot = useExternalStoreFrom(
      () => props.resource,
      (resource, cb) => resource.subscribe(cb),
      (resource) => resource.getSnapshot(),
    );

    return (): VNodeChild => {
      const {
        resource,
        renderUnsupported,
        wrapSurface,
        renderFallback,
        renderError,
        className: surfaceClassName,
      } = props;

      const data = snapshot.value.value;
      const status = snapshot.value.status;
      const error = snapshot.value.error;

      if (status === 'pending' && data === undefined) {
        // Use a ternary instead of `??` so consumers can return `null` from
        // the override callback to suppress the built-in placeholder.
        return renderFallback ? renderFallback() : defaultLoading();
      }

      if (status === 'error') {
        return renderError
          ? renderError(error)
          : h('text', `Error: ${String(error)}`);
      }

      if (!data) return null;

      const dataObj = data as unknown as Record<string, unknown>;
      const type = dataObj['type'] as string;
      const surfaceId = dataObj['surfaceId'] as string;
      const surface = dataObj['surface'] as Surface;
      const component = dataObj['component'] as ComponentInstance | undefined;

      if (type === 'beginRendering') {
        const id = surface.rootComponentId!;
        const childResource = surface.resources.get(id);
        if (!childResource) return null;
        const childProps: Record<string, unknown> = {
          resource: childResource,
        };
        if (wrapSurface) childProps['wrapSurface'] = wrapSurface;
        if (renderFallback) childProps['renderFallback'] = renderFallback;
        if (renderError) childProps['renderError'] = renderError;
        if (renderUnsupported) {
          childProps['renderUnsupported'] = renderUnsupported;
        }

        const inner = h(
          'view',
          { id: `surface-${surfaceId}`, class: surfaceClassName },
          [h(A2UIRenderer, childProps)],
        );
        return wrapSurface ? wrapSurface(inner, { surfaceId }) : inner;
      }

      if (type === 'surfaceUpdate' && component) {
        return h(NodeRenderer, {
          component,
          surface,
          renderUnsupported,
        });
      }

      if (type === 'deleteSurface') {
        return null;
      }

      return null;
    };
  },
});

/**
 * Renders a single component instance (and, through catalog containers,
 * its subtree). Subscribes to the component's resource so `surfaceUpdate`s
 * re-render just this node.
 *
 * @internal
 */
export const NodeRenderer: GenUIComponent = defineComponent({
  name: 'A2UINodeRenderer',
  props: {
    component: {
      type: Object as PropType<ComponentInstance>,
      required: true,
    },
    surface: { type: Object as PropType<Surface>, required: true },
    suppressActionDispatch: { type: Boolean, default: false },
    renderUnsupported: {
      type: Function as PropType<(info: UnsupportedInfo) => VNodeChild>,
      default: undefined,
    },
  },
  setup(
    props: {
      component: ComponentInstance;
      surface: Surface;
      suppressActionDispatch: boolean;
      renderUnsupported?: (info: UnsupportedInfo) => VNodeChild;
    },
  ) {
    const ctx = useA2UIContext();

    const noResourceSnapshot = {
      status: 'pending' as const,
      value: undefined as ResourceInfo | undefined,
      error: undefined as unknown,
    };

    const latest = useExternalStoreFrom(
      () => props.surface.resources.get(props.component.id!),
      (resource, cb) => (resource ? resource.subscribe(cb) : () => {}),
      (resource) => (resource ? resource.getSnapshot() : noResourceSnapshot),
    );

    const effectiveComponent = computed<ComponentInstance>(() => {
      const initialComponent = props.component;
      const component =
        (latest.value.value as { component?: ComponentInstance } | undefined)
          ?.component
          ?? initialComponent;
      return initialComponent.dataContextPath !== undefined
          && component.dataContextPath !== initialComponent.dataContextPath
        ? { ...component, dataContextPath: initialComponent.dataContextPath }
        : component;
    });

    watchEffect(() => {
      const tag = effectiveComponent.value.component;
      if (!ctx.catalogMap.has(tag) && !warnedTags.has(tag)) {
        warnedTags.add(tag);
        console.warn(`[a2ui] Component "${tag}" is not in the active catalog.`);
      }
    });

    const [resolvedProps, setValue] = useResolvedProps(
      () =>
        effectiveComponent.value as unknown as Record<string, unknown>,
      () => props.surface,
      () => effectiveComponent.value.dataContextPath,
      ctx.processor,
      () => ctx.catalog.functions,
    );

    const { sendAction } = useAction({
      id: () => effectiveComponent.value.id!,
      surfaceId: () => props.surface.surfaceId,
      dataContext: () => effectiveComponent.value.dataContextPath,
    });

    return (): VNodeChild =>
      buildNodeRecursive(
        effectiveComponent.value,
        props.surface,
        ctx.catalogMap,
        props.renderUnsupported,
        resolvedProps.value,
        setValue,
        (a: Record<string, unknown>) => {
          void sendAction(a as unknown as Parameters<typeof sendAction>[0]);
        },
        props.suppressActionDispatch,
      );
  },
});
