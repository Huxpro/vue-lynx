// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  createLibrary as coreCreateLibrary,
  defineComponent as coreDefineComponent,
} from '@openuidev/lang-core';
import type {
  ActionEvent as CoreActionEvent,
  DefinedComponent as CoreDefinedComponent,
  Library as CoreLibrary,
  LibraryDefinition as CoreLibraryDefinition,
  ComponentRenderProps as CoreRenderProps,
} from '@openuidev/lang-core';
import type { z } from 'zod/v4';
import type { $ZodObject } from 'zod/v4/core';

import type { VNodeChild } from '@vue/runtime-core';

// Re-export framework-agnostic types unchanged
export type {
  ComponentGroup,
  LibraryJSONSchema,
  PromptOptions,
  SubComponentOf,
  ToolDescriptor,
} from '@openuidev/lang-core';

// ─── Vue-specific types ─────────────────────────────────────────────────────

/**
 * Props passed to an OpenUI Vue Lynx component renderer.
 */
export interface ComponentRenderProps<P = Record<string, unknown>>
  extends CoreRenderProps<P, VNodeChild>
{
  onAction?: (event: CoreActionEvent) => void;
}

/**
 * An OpenUI component renderer. Either a plain functional Vue component
 * `(props: ComponentRenderProps<P>) => VNodeChild` or a stateful
 * `defineComponent(...)` accepting the same props.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentRenderer<P = Record<string, unknown>> = any;

export type DefinedComponent<T extends $ZodObject = $ZodObject> =
  CoreDefinedComponent<
    T,
    ComponentRenderer<z.infer<T>>
  >;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Library = CoreLibrary<ComponentRenderer<any>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LibraryDefinition = CoreLibraryDefinition<ComponentRenderer<any>>;

// ─── defineComponent (Vue) ──────────────────────────────────────────────────

/**
 * Define a Vue Lynx component renderer and its OpenUI schema metadata.
 * The Vue analogue of the upstream ReactLynx `defineComponent` — not to be
 * confused with Vue's own `defineComponent` (alias on import when both are
 * needed).
 */
export function defineComponent<T extends $ZodObject>(config: {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer<z.infer<T>>;
}): DefinedComponent<T> {
  return coreDefineComponent<T, ComponentRenderer<z.infer<T>>>(config);
}

// ─── createLibrary (Vue) ────────────────────────────────────────────────────

/**
 * Create a typed OpenUI library from Vue Lynx component definitions.
 *
 * @internal
 */
export function createLibrary(input: LibraryDefinition): Library {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return coreCreateLibrary<ComponentRenderer<any>>(input) as Library;
}

export type RenderOutput = VNodeChild;
