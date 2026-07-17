// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineAsyncComponent, defineComponent, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import type { GenUIComponent } from '../../vue/component.js';
import type { GenericComponentProps } from '../../store/types.js';

declare const SystemInfo: { platform?: unknown } | undefined;

function isWebPlatform(): boolean {
  return typeof SystemInfo !== 'undefined'
    && String(SystemInfo?.platform) === 'web';
}

function lazyComponentFallback(text: string): VNodeChild {
  return h(
    'view',
    {
      style: {
        width: '100%',
        minHeight: '20px',
        padding: '6px',
        borderRadius: '6px',
        backgroundColor: 'var(--a2ui-color-surface-muted)',
      },
    },
    [
      h(
        'text',
        { style: { fontSize: '10px', lineHeight: '12px' } },
        text,
      ),
    ],
  );
}

/**
 * Props for the built-in LazyComponent catalog component.
 *
 * NOTE (Vue port): upstream lazy bundles are **ReactLynx** standalone
 * bundles whose default export is a React component — those cannot render
 * inside a Vue tree. This port loads bundles whose default export is a
 * **Vue** component instead. Bundles targeting the upstream ReactLynx
 * format need to be rebuilt for Vue Lynx.
 *
 * @a2uiCatalog LazyComponent
 */
export interface LazyComponentProps extends GenericComponentProps {
  /**
   * URL of a standalone lazy bundle whose default export is a Vue
   * component. Used by native Lynx rendering.
   */
  url: string;
  /**
   * Optional URL of the web lazy bundle. Lynx for Web uses this instead of
   * `url`; when omitted, web rendering shows a fallback that asks the user
   * to scan the native preview QR code on a mobile device.
   */
  webUrl?: string;
  /**
   * Data passed to the lazy bundle component as `sourceData`.
   */
  sourceData?: Record<string, unknown> | Record<string, unknown>[];
  /**
   * Optional text shown while the lazy bundle is loading.
   */
  fallbackText?: string;
}

const loadedComponents = new Map<string, GenUIComponent>();

function getLazyBundleComponent(bundleUrl: string): GenUIComponent {
  let component = loadedComponents.get(bundleUrl);
  if (!component) {
    component = defineAsyncComponent({
      loader: () =>
        import(/* webpackIgnore: true */ bundleUrl) as Promise<{
          default: GenUIComponent;
        }>,
      loadingComponent: undefined,
    });
    loadedComponents.set(bundleUrl, component);
  }
  return component;
}

/**
 * Render a dynamically loaded standalone bundle component.
 */
export const LazyComponent: GenUIComponent = defineComponent({
  name: 'LazyComponent',
  props: catalogProps('url', 'webUrl', 'sourceData', 'fallbackText'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as LazyComponentProps;

    return (): VNodeChild => {
      const { url, webUrl, sourceData } = props;
      const isWeb = isWebPlatform();
      const bundleUrl = isWeb
        ? (typeof webUrl === 'string' ? webUrl : '')
        : (typeof url === 'string' ? url : '');

      if (isWeb && bundleUrl.length === 0) {
        return lazyComponentFallback(
          'Scan the native preview QR code on a mobile device to view this lazy component.',
        );
      }

      if (bundleUrl.length === 0) {
        return lazyComponentFallback(
          'Lazy component content requires a url',
        );
      }

      return h(getLazyBundleComponent(bundleUrl), { sourceData });
    };
  },
});
