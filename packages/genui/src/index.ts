// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// The root entry point exports the stable APIs most applications need —
// mirrors the upstream `@lynx-js/genui` root entry, minus the catalog
// extractor (not ported; see PORTING.md).

export {
  A2UI,
  NodeRenderer,
  useAction,
  useChecks,
  useDataBinding,
  useResolvedProps,
} from './a2ui/vue/index.js';
export type {
  A2UIProps,
  ActionProps,
  CheckLike,
} from './a2ui/vue/index.js';
export {
  createFallbackMessagesFromPlainText,
  createMessageStore,
  createResource,
  createTextCardMessages,
  executeFunctionCall,
  FunctionRegistry,
  functionRegistry,
  isDataBinding,
  isFunctionCall,
  MessageProcessor,
  normalizePayloadToMessages,
  prepareMessagesForProcessing,
  resolveDynamicValue,
  resolveFunctionArguments,
  SignalStore,
} from './a2ui/store/index.js';
export type {
  A2UIClientEventMessage,
  A2UIEvent,
  ComponentInstance,
  FunctionCallContext,
  FunctionEntry,
  FunctionImpl,
  GenericComponentProps,
  MessageStore,
  MessageStoreOptions,
  RawResource,
  ResolveFunctionOptions,
  Resource,
  ResourceInfo,
  ResourceStatus,
  ServerToClientMessage,
  Surface,
  SurfaceId,
  UserActionPayload,
} from './a2ui/store/index.js';
export {
  basicFunctions,
  registerBasicFunctions,
} from './a2ui/functions/index.js';
export * from './openui/core/index.js';
export {
  buildOpenUiSystemPrompt,
  createOpenUiPromptLibrary,
  OPENUI_SYSTEM_PROMPT,
  openUiPromptActionPropSchema,
} from './openui/openui-prompt/index.js';
export type {
  BuildOpenUiSystemPromptOptions,
  CreateOpenUiPromptLibraryOptions,
  OpenUiPromptComponent,
  OpenUiPromptLibrary,
} from './openui/openui-prompt/index.js';
