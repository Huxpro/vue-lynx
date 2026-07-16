export * from 'vue-lynx/vapor';

import { createVaporApp as rawCreateVaporApp } from '@vue/runtime-vapor/raw';
export {
  DynamicFragment,
  RenderEffect,
  SlotFragment,
  VaporComponentInstance,
  applyFallthroughProps,
  currentInstance,
  currentSlotBoundary,
  currentSlotOwner,
  enableSuspense,
  getCurrentSlotEndAnchor,
  hydrateDynamicFragmentAnchor,
  hydrateNode,
  insertFragment,
  insertNode,
  isApplyingFallthroughProps,
  isHydratingSlotFallbackActive,
  isHydrationAnchor,
  isValidBlock,
  isValidSlot,
  markSlotResolutionDirty,
  normalizeBlock,
  parentSuspense,
  recheckSlotResolution,
  removeFragment,
  removeNode,
  resolveDynamicProps,
  setCurrentHydrationNode,
  setCurrentSlotOwner,
  setDynamicProp,
  setIsHydratingEnabled,
  setParentSuspense,
  trackSlotBoundaryDirtying,
  withHydratingSlotBoundary,
  withHydratingSlotFallbackActive,
  withSlotBoundary,
} from '@vue/runtime-vapor/raw';

// Upstream tests need the raw app contract: mount(host), _instance and
// _container. Production vue-lynx intentionally wraps this API to mount the
// Lynx page root, so only this test bridge replaces createVaporApp.
type RawVaporApp = ReturnType<typeof rawCreateVaporApp>;

const activeApps = new Map<RawVaporApp, () => void>();

export function createVaporApp(
  ...args: Parameters<typeof rawCreateVaporApp>
): RawVaporApp {
  const app = rawCreateVaporApp(...args);
  const rawUnmount = app.unmount.bind(app);

  activeApps.set(app, rawUnmount);
  app.unmount = (() => {
    try {
      return rawUnmount();
    } finally {
      activeApps.delete(app);
    }
  }) as typeof app.unmount;

  return app;
}

/** Unmount every raw Vapor app that survived an upstream test. */
export function cleanupVaporAppsForTesting(): void {
  const errors: unknown[] = [];
  for (const [app, rawUnmount] of activeApps) {
    try {
      // Calling unmount on an app that was only created emits a Vue warning.
      // Such an app has no runtime state to dispose; clearing the registry is
      // sufficient. Mounted apps always expose their raw `_container`.
      if (app._container) rawUnmount();
    } catch (error) {
      errors.push(error);
    }
  }
  activeApps.clear();

  if (errors.length > 0) {
    throw new AggregateError(errors, 'Failed to clean up Vapor test apps');
  }
}
