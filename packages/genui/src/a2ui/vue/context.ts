// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { computed, inject, provide } from '@vue/runtime-core';
import type { InjectionKey } from '@vue/runtime-core';

import type { Catalog, CatalogComponent } from '../catalog/defineCatalog.js';
import { resolveCatalog } from '../catalog/defineCatalog.js';
import type { FormController } from '../store/FormController.js';
import type { MessageProcessor } from '../store/MessageProcessor.js';

export type {
  CheckFailure,
  CheckOutcome,
  FormController,
} from '../store/FormController.js';
export { createFormController } from '../store/FormController.js';

/**
 * The context value `<A2UI>` provides to its catalog-component subtree.
 * Internal — not part of the public API. Catalog components reach this
 * value via `useAction`, `useDataBinding`, etc.
 */
export interface A2UIInternalContext {
  processor: MessageProcessor;
  readonly catalog: Catalog;
  readonly catalogMap: ReadonlyMap<string, CatalogComponent>;
}

export const A2UIContextKey: InjectionKey<A2UIInternalContext> = Symbol(
  'a2ui-context',
);

/**
 * Internal provider called from `<A2UI>`'s setup. The Vue analogue of the
 * upstream `<A2UIProvider>` component — `provide()` replaces the JSX
 * wrapper, and `catalog` stays reactive via computed-backed getters.
 */
export function provideA2UIContext(
  processor: MessageProcessor,
  catalog: () => Catalog,
): A2UIInternalContext {
  const catalogRef = computed(catalog);
  const catalogMapRef = computed(() => resolveCatalog(catalogRef.value));
  const value: A2UIInternalContext = {
    processor,
    get catalog() {
      return catalogRef.value;
    },
    get catalogMap() {
      return catalogMapRef.value;
    },
  };
  provide(A2UIContextKey, value);
  return value;
}

/**
 * Internal helper used by catalog-component composables (`useAction`, the
 * renderer, …) to reach the `<A2UI>`-owned context.
 */
export function useA2UIContext(): A2UIInternalContext {
  const ctx = inject(A2UIContextKey, null);
  if (!ctx) {
    throw new Error(
      '[a2ui] Catalog-component composables must be used inside a tree '
        + 'rendered by `<A2UI>`.',
    );
  }
  return ctx;
}

/**
 * Internal composable — returns the resolved name → component map. Used by
 * the renderer and exposed for advanced custom components that want to peek
 * at the active catalog.
 */
export function useCatalog(): ReadonlyMap<string, CatalogComponent> {
  return useA2UIContext().catalogMap;
}

/**
 * Injection key exposing the nearest enclosing form controller, if any.
 * Inputs use it to broadcast their check outcomes; Buttons use it to read
 * `isValid` and disable themselves until every input passes. The Vue
 * analogue of the upstream React `FormContext`.
 */
export const FormContextKey: InjectionKey<FormController | null> = Symbol(
  'a2ui-form-context',
);

/**
 * Read the nearest enclosing form controller, or `null` when the component
 * is not inside a form.
 */
export function useFormContext(): FormController | null {
  return inject(FormContextKey, null);
}
