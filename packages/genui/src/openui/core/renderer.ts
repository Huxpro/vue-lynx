// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type {
  ActionEvent,
  ActionPlan,
  ElementNode,
  EvaluationContext,
  McpClientLike,
  ParseResult,
  Store,
  ToolProvider,
} from '@openuidev/lang-core';
import {
  ACTION_STEPS,
  BuiltinActionType,
  ToolNotFoundError,
  createStore,
  extractToolResult,
} from '@openuidev/lang-core';

import {
  Fragment,
  defineComponent,
  getCurrentInstance,
  h,
  onScopeDispose,
  shallowRef,
  watchEffect,
} from '@vue/runtime-core';
import type { PropType, VNodeChild } from '@vue/runtime-core';

import {
  provideOpenUIContext,
  useOpenUI,
  useRenderNode,
} from './context.js';
import type { OpenUIContextValue } from './context.js';
import { useOpenUIState } from './hooks/useOpenUIState.js';
import type { ComponentRenderer, Library, RenderOutput } from './library.js';
import { keyFrom } from './utils.js';
import type { LegacyActionConfig } from '../catalog/Action/index.js';

import '../../../styles/openui/renderer.css';

export type { Library, RenderOutput };

export type ToolProviderInput =
  | Record<string, (args: Record<string, unknown>) => unknown>
  | McpClientLike
  | null;

/**
 * Props for rendering raw OpenUI response text with parsing, runtime state,
 * actions, and query execution.
 */
export interface OpenUiRendererRuntimeProps {
  /** Raw openui-lang response text. This enables v0.5 runtime features. */
  response: string | null;
  /** Component library from createOpenUiLibrary(). */
  library: Library;
  /** Whether the LLM is still streaming; disables interactions while true. */
  isStreaming?: boolean;
  /** Callback when a component triggers a host action. */
  onAction?: (event: ActionEvent) => void;
  /** Called whenever $variables or form state changes. */
  onStateUpdate?: (state: Record<string, unknown>) => void;
  /** Initial persisted state. $-prefixed keys hydrate reactive bindings. */
  initialState?: Record<string, unknown>;
  /** Called whenever the raw parse result changes. */
  onParseResult?: (result: ParseResult | null) => void;
  /** Tool provider for Query()/Mutation(): function map or MCP client. */
  toolProvider?: ToolProviderInput;
  /** Custom loading node shown while Query() calls are in flight. */
  queryLoader?: VNodeChild;
  /** Structured parser/runtime/query errors for correction loops. */
  onError?: (errors: OpenUIError[]) => void;
}

import type { OpenUIError } from '@openuidev/lang-core';

/**
 * Props for rendering an already parsed OpenUI result.
 */
export interface OpenUiRendererParsedProps {
  /** Pre-parsed result. Kept for v0.1/static-render compatibility. */
  result: ParseResult | null;
  library: Library;
  onAction?: (event: ActionEvent) => void;
  isStreaming?: boolean;
}

export type OpenUiRendererProps =
  | OpenUiRendererRuntimeProps
  | OpenUiRendererParsedProps;

interface FieldEntry {
  value: unknown;
  componentType?: string;
}

type FormStateValue = FieldEntry | Record<string, FieldEntry>;
type FormState = Record<string, FormStateValue>;

function isElementNode(value: unknown): value is ElementNode {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && 'typeName' in value
    && (value as Record<string, unknown>)['type'] === 'element'
  );
}

function createFieldEntry(
  value: unknown,
  componentType: string | undefined,
): FieldEntry {
  return componentType === undefined ? { value } : { value, componentType };
}

function isFieldEntry(value: unknown): value is FieldEntry {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && 'value' in value
  );
}

function isFieldMap(value: unknown): value is Record<string, FieldEntry> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.values(value).every((entry) => isFieldEntry(entry))
  );
}

function getFieldEntry(
  state: FormState,
  formName: string | undefined,
  name: string,
): FieldEntry | undefined {
  if (!formName) {
    const value = state[name];
    return isFieldEntry(value) ? value : undefined;
  }

  const formValue = state[formName];
  if (!isFieldMap(formValue)) return undefined;
  return formValue[name];
}

function renderDeep(value: unknown): VNodeChild {
  if (value === null || value === undefined) return null;

  if (
    typeof value === 'string' || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return h('text', String(value));
  }

  if (Array.isArray(value)) {
    return value.map((v, i) =>
      h(Fragment, { key: keyFrom(v, i) }, [renderDeep(v)])
    );
  }

  if (isElementNode(value)) {
    const stableKey = value.statementId ?? keyFrom(value);
    return h(RenderNode, { key: stableKey, node: value });
  }

  return null;
}

export const RenderNode = defineComponent({
  name: 'OpenUIRenderNode',
  props: {
    node: { type: Object as PropType<ElementNode>, required: true },
  },
  setup(props: { node: ElementNode }) {
    const ctx = useOpenUI();

    return (): VNodeChild => {
      const node = props.node;
      const Comp = ctx.library.components[node.typeName]?.component as
        | ComponentRenderer
        | undefined;

      if (!Comp) return null;

      try {
        return h(RenderNodeInner, { el: node, Comp });
      } catch (error) {
        ctx.reportError?.({
          source: 'runtime',
          code: 'render-error',
          component: node.typeName,
          message: `Component ${node.typeName} render failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
        return null;
      }
    };
  },
});

const RenderNodeInner = defineComponent({
  name: 'OpenUIRenderNodeInner',
  props: {
    el: { type: Object as PropType<ElementNode>, required: true },
    // biome-ignore lint/suspicious/noExplicitAny: ported upstream API is typed with `any`
    Comp: { type: null as unknown as PropType<any>, required: true },
  },
  setup(props: { el: ElementNode; Comp: ComponentRenderer }) {
    const renderNode = useRenderNode();
    return (): VNodeChild =>
      h(props.Comp, {
        props: props.el.props,
        renderNode,
        ...(props.el.statementId
          ? { statementId: props.el.statementId }
          : {}),
      });
  },
});

function defaultQueryLoader(): VNodeChild {
  return h('view', { class: 'OpenUIQueryLoader' }, [
    h('view', { class: 'OpenUIQueryLoaderDot' }),
  ]);
}

const RuntimeOpenUiRenderer = defineComponent({
  name: 'RuntimeOpenUiRenderer',
  props: [
    'response',
    'library',
    'isStreaming',
    'onAction',
    'onStateUpdate',
    'initialState',
    'onParseResult',
    'toolProvider',
    'queryLoader',
    'onError',
  ],
  setup(props: OpenUiRendererRuntimeProps) {
    const stableToolProvider: ToolProvider = {
      async callTool(
        toolName: string,
        args: Record<string, unknown>,
      ): Promise<unknown> {
        const current = props.toolProvider ?? null;
        if (current === null) {
          throw new Error('[openui] toolProvider is null');
        }

        if (typeof (current as McpClientLike).callTool === 'function') {
          const result = await (current as McpClientLike).callTool({
            name: toolName,
            arguments: args,
          });
          return extractToolResult(result);
        }

        const map = current as Record<
          string,
          (a: Record<string, unknown>) => unknown
        >;
        const fn = map[toolName];
        if (!fn) throw new ToolNotFoundError(toolName, Object.keys(map));
        return await fn(args);
      },
    };

    const { result, parseResult, contextValue, isQueryLoading } =
      useOpenUIState(
        {
          response: () => props.response,
          library: () => props.library,
          isStreaming: () => props.isStreaming ?? false,
          toolProvider: () =>
            props.toolProvider !== null && props.toolProvider !== undefined
              ? stableToolProvider
              : null,
          onAction: (event) => props.onAction?.(event),
          onStateUpdate: (state) => props.onStateUpdate?.(state),
          initialState: () => props.initialState,
          onError: (errors) => props.onError?.(errors),
        },
        renderDeep,
      );

    watchEffect(() => {
      const parsed = parseResult.value;
      props.onParseResult?.(parsed);
    });

    provideOpenUIContext(contextValue);

    return (): VNodeChild => {
      if (!result.value?.root) return null;

      return h('view', { class: 'OpenUIRenderer' }, [
        isQueryLoading.value
          ? (props.queryLoader ?? defaultQueryLoader())
          : null,
        h(
          'view',
          {
            class: isQueryLoading.value
              ? 'OpenUIRendererContent OpenUIRendererContentLoading'
              : 'OpenUIRendererContent',
          },
          [h(RenderNode, { node: result.value.root })],
        ),
      ]);
    };
  },
});

const ParsedOpenUiRenderer = defineComponent({
  name: 'ParsedOpenUiRenderer',
  props: ['result', 'library', 'onAction', 'isStreaming'],
  setup(props: OpenUiRendererParsedProps) {
    const formState = shallowRef<FormState>({});
    const store: Store = createStore();

    onScopeDispose(() => store.dispose());

    const getFieldValue = (formName: string | undefined, name: string) => {
      return getFieldEntry(formState.value, formName, name)?.value;
    };

    const setFieldValue = (
      formName: string | undefined,
      componentType: string | undefined,
      name: string,
      value: unknown,
      _shouldTriggerSaveCallback = true,
    ) => {
      const currentState = formState.value;
      const newState = { ...currentState };

      if (formName) {
        const currentFormValue = currentState[formName];
        newState[formName] = {
          ...(isFieldMap(currentFormValue) ? currentFormValue : {}),
          [name]: createFieldEntry(value, componentType),
        };
      } else {
        newState[name] = createFieldEntry(value, componentType);
        store.set(name, value);
      }

      formState.value = newState;
    };

    const triggerAction = (
      userMessage: string,
      formName?: string,
      action?: ActionPlan | LegacyActionConfig,
    ) => {
      const currentState = formState.value;
      const handler = props.onAction;

      // ActionPlan path (v0.5) — sequential steps
      if (action && 'steps' in action) {
        let relevantState: Record<string, unknown> | undefined;
        const formValue = formName ? currentState[formName] : undefined;
        if (formName && formValue !== undefined) {
          relevantState = { [formName]: formValue };
        } else if (Object.keys(currentState).length > 0) {
          relevantState = currentState;
        }

        for (const step of action.steps) {
          switch (step.type) {
            case ACTION_STEPS.ToAssistant:
              handler?.({
                type: BuiltinActionType.ContinueConversation,
                params: step.context ? { context: step.context } : {},
                humanFriendlyMessage: step.message,
                ...(relevantState ? { formState: relevantState } : {}),
                ...(formName ? { formName } : {}),
              });
              break;
            case ACTION_STEPS.OpenUrl:
              handler?.({
                type: BuiltinActionType.OpenUrl,
                params: { url: step.url },
                humanFriendlyMessage: '',
                ...(relevantState ? { formState: relevantState } : {}),
                ...(formName ? { formName } : {}),
              });
              break;
            case ACTION_STEPS.Run:
            case ACTION_STEPS.Set:
            case ACTION_STEPS.Reset:
              // OpenUiRenderer does not own the query manager, store, or
              // evaluation context needed to execute these steps. Report them
              // explicitly so generated plans do not fail silently here.
              console.warn(
                `[OpenUiRenderer] Unsupported ActionPlan step: ${step.type}`,
                step,
              );
              break;
            default:
              console.warn(
                '[OpenUiRenderer] Unknown ActionPlan step:',
                step,
              );
              break;
          }
        }
        return;
      }

      const legacyAction: LegacyActionConfig | undefined =
        action && !('steps' in action)
          ? action
          : undefined;
      const actionType = legacyAction?.type
        ?? BuiltinActionType.ContinueConversation;
      const actionParams = { ...(legacyAction?.params ?? {}) };
      if (legacyAction?.url) actionParams['url'] = legacyAction.url;
      if (legacyAction?.context) actionParams['context'] = legacyAction.context;

      let relevantState: Record<string, unknown> | undefined;
      const formValue = formName ? currentState[formName] : undefined;
      if (formName && formValue !== undefined) {
        relevantState = { [formName]: formValue };
      } else if (Object.keys(currentState).length > 0) {
        relevantState = currentState;
      }

      handler?.({
        type: actionType,
        params: actionParams,
        humanFriendlyMessage: userMessage,
        ...(relevantState ? { formState: relevantState } : {}),
        ...(formName ? { formName } : {}),
      });
    };

    const evaluationContext: EvaluationContext = {
      getState: (name: string) => getFieldValue(undefined, name),
      resolveRef: () => undefined,
    };

    const contextValue: OpenUIContextValue = {
      get library() {
        return props.library;
      },
      renderNode: renderDeep,
      triggerAction,
      get isStreaming() {
        return props.isStreaming ?? false;
      },
      isQueryLoading: false,
      getFieldValue,
      setFieldValue,
      store,
      evaluationContext,
    };

    provideOpenUIContext(contextValue);

    return (): VNodeChild => {
      if (!props.result?.root) return null;
      return h(RenderNode, { node: props.result.root });
    };
  },
});

/**
 * Render OpenUI language output using a Vue Lynx component library.
 */
export const OpenUiRenderer = defineComponent({
  name: 'OpenUiRenderer',
  props: [
    'response',
    'result',
    'library',
    'isStreaming',
    'onAction',
    'onStateUpdate',
    'initialState',
    'onParseResult',
    'toolProvider',
    'queryLoader',
    'onError',
  ],
  setup(props: Record<string, unknown>) {
    // Discriminate the two prop shapes by which keys the caller actually
    // passed (array-declared props always exist on `props`, so `in` checks
    // must look at the raw vnode props like upstream's `'response' in props`).
    const instance = getCurrentInstance();
    const isRuntimeMode = () => {
      const raw = instance?.vnode.props ?? {};
      return 'response' in raw;
    };

    return (): VNodeChild => {
      if (isRuntimeMode()) {
        const runtimeProps: Record<string, unknown> = {
          response: props['response'],
          library: props['library'],
          isStreaming: props['isStreaming'],
          onAction: props['onAction'],
          onStateUpdate: props['onStateUpdate'],
          initialState: props['initialState'],
          onParseResult: props['onParseResult'],
          toolProvider: props['toolProvider'],
          queryLoader: props['queryLoader'],
          onError: props['onError'],
        };
        return h(RuntimeOpenUiRenderer as ComponentRenderer, runtimeProps);
      }
      const parsedProps: Record<string, unknown> = {
        result: props['result'],
        library: props['library'],
        onAction: props['onAction'],
        isStreaming: props['isStreaming'],
      };
      return h(ParsedOpenUiRenderer as ComponentRenderer, parsedProps);
    };
  },
});
