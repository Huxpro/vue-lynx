// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  ACTION_STEPS,
  BuiltinActionType,
  createQueryManager,
  createStore,
  createStreamingParser,
  enrichErrors,
  evaluate,
  evaluateElementProps,
} from '@openuidev/lang-core';
import type {
  ActionEvent,
  ActionPlan,
  EvalContext,
  EvaluationContext,
  OpenUIError,
  ParseResult,
  QueryManager,
  Store,
  ToolProvider,
} from '@openuidev/lang-core';

import {
  computed,
  onScopeDispose,
  shallowRef,
  watch,
  watchEffect,
} from '@vue/runtime-core';
import type { ComputedRef, VNodeChild } from '@vue/runtime-core';

import type { LegacyActionConfig } from '../../catalog/Action/index.js';
import type { OpenUIContextValue } from '../context.js';
import type { Library } from '../library.js';

/** Unwrap { value, componentType } wrapper from form field entries. Returns raw value. */
function unwrapFieldValue(v: unknown): unknown {
  if (
    v
    && typeof v === 'object'
    && !Array.isArray(v)
    && 'value' in (v as Record<string, unknown>)
  ) {
    return (v as Record<string, unknown>)['value'];
  }
  return v;
}

function evaluateString(
  ast: Parameters<typeof evaluate>[0],
  evaluationContext: EvaluationContext,
): string {
  const evaluated = evaluate(ast, evaluationContext);
  return typeof evaluated === 'string' ? evaluated : '';
}

function evaluateNumber(
  ast: Parameters<typeof evaluate>[0],
  evaluationContext: EvaluationContext,
): number | undefined {
  const evaluated = evaluate(ast, evaluationContext);
  return typeof evaluated === 'number' ? evaluated : undefined;
}

function evaluateRecord(
  ast: Parameters<typeof evaluate>[0],
  evaluationContext: EvaluationContext,
): Record<string, unknown> {
  const evaluated = evaluate(ast, evaluationContext);
  return (
      typeof evaluated === 'object'
      && evaluated !== null
      && !Array.isArray(evaluated)
    )
    ? (evaluated as Record<string, unknown>)
    : {};
}

/**
 * Inputs used to parse OpenUI text and build renderer state. Reactive
 * fields arrive as getters so the derived state tracks prop updates.
 */
export interface UseOpenUIStateOptions {
  response: () => string | null;
  library: () => Library;
  isStreaming: () => boolean;
  onAction?: (event: ActionEvent) => void;
  onStateUpdate?: (state: Record<string, unknown>) => void;
  initialState?: () => Record<string, unknown> | undefined;
  /** ToolProvider for Query data fetching — MCP, REST, GraphQL, or any backend. */
  toolProvider?: () => ToolProvider | null;
  /** Callback for structured, LLM-friendly errors. See OpenUIError type. */
  onError?: (errors: OpenUIError[]) => void;
}

/**
 * Derived OpenUI renderer state returned by `useOpenUIState`.
 */
export interface OpenUIState {
  /** Evaluated result (props resolved to concrete values). Used by Renderer. */
  result: ComputedRef<ParseResult | null>;
  /** Raw parse result (AST nodes in props). Used by onParseResult callback. */
  parseResult: ComputedRef<ParseResult | null>;
  contextValue: OpenUIContextValue;
  /** Whether any Query is currently fetching data. */
  isQueryLoading: ComputedRef<boolean>;
}

/**
 * Core state composable — extracts all form state, action handling, parser
 * management, and context assembly out of the Renderer component.
 *
 * Store holds everything: $bindings as top-level keys, form fields nested
 * under formName as plain values.
 */
export function useOpenUIState(
  options: UseOpenUIStateOptions,
  renderDeep: (value: unknown) => VNodeChild,
): OpenUIState {
  const {
    response,
    library,
    isStreaming,
    onAction,
    onStateUpdate,
    initialState,
    toolProvider,
    onError,
  } = options;

  // ─── Streaming parser (incremental — caches completed statements) ───
  const sp = computed(() => {
    const lib = library();
    return createStreamingParser(lib.toJSONSchema(), lib.root);
  });

  // ─── Parse result ───
  let parseException: OpenUIError | null = null;
  const result = computed<ParseResult | null>(() => {
    parseException = null;
    const text = response();
    if (!text) return null;
    try {
      return sp.value.set(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      parseException = {
        source: 'parser',
        code: 'parse-exception',
        message: `Parser crashed: ${msg}`,
        hint: 'The response may contain syntax the parser cannot handle',
      };
      return null;
    }
  });

  // ─── Store (holds everything: $bindings + form fields) ───
  const store: Store = createStore();

  // ─── QueryManager ───
  const queryManager = computed<QueryManager>(() =>
    createQueryManager(toolProvider?.() ?? null)
  );

  watch(
    queryManager,
    (qm, _prev, onCleanup) => {
      qm.activate();
      onCleanup(() => qm.dispose());
    },
    { immediate: true },
  );

  // ─── Initialize Store ───
  let storeInitKey: unknown = Symbol();
  watchEffect(() => {
    const stateDeclarationsValue = result.value?.stateDeclarations;
    const initialStateValue = initialState?.();
    if (!stateDeclarationsValue && !initialStateValue) return;
    const stateDeclarations = stateDeclarationsValue ?? {};
    const streaming = isStreaming();
    const key = `${streaming ? 'streaming' : 'stable'}::${
      JSON.stringify(stateDeclarations)
    }::${JSON.stringify(initialStateValue)}`;
    if (storeInitKey === key) return;
    storeInitKey = key;

    // Split initialState: $-prefixed keys are bindings, everything else is form state
    const bindingDefaults: Record<string, unknown> = {};
    if (initialStateValue) {
      for (const [key, value] of Object.entries(initialStateValue)) {
        if (key.startsWith('$')) {
          bindingDefaults[key] = value;
        } else {
          // Form state — restore as-is (preserves { value, componentType } wrapper)
          store.set(key, value);
        }
      }
    }

    if (streaming) {
      for (const [key, value] of Object.entries(bindingDefaults)) {
        store.set(key, value);
      }
      for (const [key, value] of Object.entries(stateDeclarations)) {
        if (Object.prototype.hasOwnProperty.call(bindingDefaults, key)) {
          continue;
        }
        store.set(key, value);
      }
      return;
    }

    store.initialize(stateDeclarations, bindingDefaults);
  });

  // ─── Subscribe to Store and QueryManager for re-renders ───
  const storeSnapshot = shallowRef(store.getSnapshot());
  {
    const unsub = store.subscribe(() => {
      storeSnapshot.value = store.getSnapshot();
    });
    onScopeDispose(unsub, true);
  }

  const querySnapshot = shallowRef(queryManager.value.getSnapshot());
  watch(
    queryManager,
    (qm, _prev, onCleanup) => {
      querySnapshot.value = qm.getSnapshot();
      onCleanup(qm.subscribe(() => {
        querySnapshot.value = qm.getSnapshot();
      }));
    },
    { immediate: true },
  );

  // ─── Build EvaluationContext ───
  const evaluationContext: EvaluationContext = {
    getState: (name: string) => unwrapFieldValue(store.get(name)),
    resolveRef: (name: string) => {
      const mutResult = queryManager.value.getMutationResult(name);
      if (mutResult) return mutResult;
      return queryManager.value.getResult(name);
    },
  };

  // ─── Evaluate and submit queries ───
  watchEffect(() => {
    if (isStreaming()) return;

    const queryStmts = result.value?.queryStatements ?? [];
    const snapshot = storeSnapshot.value;
    const evaluatedNodes = queryStmts.map((qn) => {
      const relevantDeps: Record<string, unknown> = {};
      if (qn.deps) {
        for (const ref of qn.deps) {
          relevantDeps[ref] = snapshot[ref];
        }
      }
      const node: {
        statementId: string;
        toolName: string;
        args: unknown;
        defaults: unknown;
        deps: unknown;
        complete: boolean;
        refreshInterval?: number;
      } = {
        statementId: qn.statementId,
        toolName: qn.toolAST
          ? evaluateString(qn.toolAST, evaluationContext)
          : '',
        args: qn.argsAST ? evaluate(qn.argsAST, evaluationContext) : null,
        defaults: qn.defaultsAST
          ? evaluate(qn.defaultsAST, evaluationContext)
          : null,
        deps: Object.keys(relevantDeps).length > 0 ? relevantDeps : undefined,
        complete: qn.complete,
      };
      if (qn.refreshAST) {
        const interval = evaluateNumber(qn.refreshAST, evaluationContext);
        if (interval !== undefined) {
          node.refreshInterval = interval;
        }
      }
      return node;
    });

    // Always call — empty array clears removed queries and their errors
    queryManager.value.evaluateQueries(evaluatedNodes);
  });

  // ─── Register mutations ───
  watchEffect(() => {
    if (isStreaming()) return;

    const mutStmts = result.value?.mutationStatements ?? [];
    const nodes = mutStmts.map((mn) => ({
      statementId: mn.statementId,
      toolName: mn.toolAST ? evaluateString(mn.toolAST, evaluationContext) : '',
    }));
    // Always call — empty array clears removed mutations and their errors
    queryManager.value.registerMutations(nodes);
  });

  // ─── Fire onStateUpdate when Store changes ───
  {
    let lastInitSnapshot: Record<string, unknown> | null = store.getSnapshot();
    const unsub = store.subscribe(() => {
      const currentSnapshot = store.getSnapshot();
      if (currentSnapshot === lastInitSnapshot) return;
      lastInitSnapshot = null;
      onStateUpdate?.(currentSnapshot);
    });
    onScopeDispose(unsub, true);
  }

  // ─── getFieldValue ───
  const getFieldValue = (formName: string | undefined, name: string) => {
    if (!formName) return unwrapFieldValue(store.get(name));
    const formData = store.get(formName);
    if (
      !formData || typeof formData !== 'object' || Array.isArray(formData)
    ) return undefined;
    return unwrapFieldValue((formData as Record<string, unknown>)[name]);
  };

  // ─── setFieldValue ───
  const setFieldValue = (
    formName: string | undefined,
    componentType: string | undefined,
    name: string,
    value: unknown,
    shouldTriggerSaveCallback = true,
  ) => {
    const wrapped = { value, componentType };
    if (formName) {
      const raw = store.get(formName);
      const formData = raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
      store.set(formName, { ...formData, [name]: wrapped });
    } else {
      store.set(name, wrapped);
    }
    if (shouldTriggerSaveCallback) {
      onStateUpdate?.(store.getSnapshot());
    }
  };

  // ─── Materialize form payload ───
  const getFormPayload = (
    formName?: string,
  ): Record<string, unknown> | undefined => {
    if (formName) {
      const raw = store.get(formName);
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        return { [formName]: raw };
      }
    }
    return store.getSnapshot();
  };

  // ─── triggerAction ───
  const triggerAction = async (
    userMessage: string,
    formName?: string,
    action?: ActionPlan | LegacyActionConfig,
  ) => {
    const formPayload = getFormPayload(formName);
    const handler = onAction;

    function buildEvent(
      type: ActionEvent['type'],
      params: Record<string, unknown>,
      humanFriendlyMessage: string,
    ): ActionEvent {
      const event: ActionEvent = { type, params, humanFriendlyMessage };
      if (formPayload !== undefined) event.formState = formPayload;
      if (formName !== undefined) event.formName = formName;
      return event;
    }

    // Legacy action config path (v0.1 compat) — { type?, params? }
    if (action && !('steps' in action)) {
      const actionType = action.type
        ?? BuiltinActionType.ContinueConversation;
      const params = { ...(action.params ?? {}) };
      // v0.1 compat — url and context were top-level, not in params
      if (action.url) params['url'] = action.url;
      if (action.context) params['context'] = action.context;
      handler?.(buildEvent(actionType, params, userMessage));
      return;
    }

    // ActionPlan path (v0.5) — sequential steps with halt-on-mutation-failure
    const actionPlan = action;
    if (actionPlan?.steps) {
      for (const step of actionPlan.steps) {
        switch (step.type) {
          case ACTION_STEPS.Run: {
            if (step.refType === 'mutation') {
              const mn = result.value?.mutationStatements?.find(
                (m) => m.statementId === step.statementId,
              );
              const evaluatedArgs = mn?.argsAST
                ? evaluateRecord(mn.argsAST, evaluationContext)
                : {};
              const ok = await queryManager.value.fireMutation(
                step.statementId,
                evaluatedArgs,
              );
              if (!ok) return; // halt on failure
            } else {
              queryManager.value.invalidate([step.statementId]);
            }
            break;
          }
          case ACTION_STEPS.ToAssistant:
            handler?.(buildEvent(
              BuiltinActionType.ContinueConversation,
              step.context ? { context: step.context } : {},
              step.message,
            ));
            break;
          case ACTION_STEPS.OpenUrl:
            handler?.(buildEvent(
              BuiltinActionType.OpenUrl,
              { url: step.url },
              '',
            ));
            break;
          case ACTION_STEPS.Set: {
            const value = evaluate(step.valueAST, evaluationContext);
            store.set(step.target, value);
            break;
          }
          case ACTION_STEPS.Reset: {
            const decls = result.value?.stateDeclarations ?? {};
            for (const target of step.targets) {
              store.set(target, decls[target] ?? null);
            }
            break;
          }
        }
      }
      return;
    }

    // Default — ContinueConversation with label
    handler?.(buildEvent(
      BuiltinActionType.ContinueConversation,
      {},
      userMessage,
    ));
  };

  // ─── reportError (for error boundary) ───
  let renderErrors: OpenUIError[] = [];
  const reportError = (error: OpenUIError) => {
    // Skip during streaming — render errors are transient and onError won't fire until streaming stops
    if (isStreaming()) return;
    renderErrors.push(error);
  };

  const isQueryLoading = computed(() =>
    querySnapshot.value.__openui_loading.length > 0
  );

  // ─── Context value (live getters — reads inside renders stay reactive) ───
  const contextValue: OpenUIContextValue = {
    get library() {
      return library();
    },
    renderNode: renderDeep,
    triggerAction,
    get isStreaming() {
      return isStreaming();
    },
    get isQueryLoading() {
      return isQueryLoading.value;
    },
    getFieldValue,
    setFieldValue,
    store,
    evaluationContext,
    reportError,
  };

  // ─── Evaluate props ───
  let runtimeErrors: OpenUIError[] = [];

  const evaluatedResult = computed<ParseResult | null>(() => {
    // Track store/query snapshots so prop re-evaluation follows state.
    void storeSnapshot.value;
    void querySnapshot.value;
    const parsed = result.value;
    if (!parsed?.root) return parsed;
    // Fresh errors array each pass — avoids mutating memoized context
    const errors: OpenUIError[] = [];
    const evalCtx: EvalContext = {
      ctx: evaluationContext,
      library: library(),
      store,
      errors,
    };
    try {
      const evaluatedRoot = evaluateElementProps(parsed.root, evalCtx);
      runtimeErrors = errors;
      return { ...parsed, root: evaluatedRoot };
    } catch (e) {
      // Safety net — per-prop catch in evaluateElementProps handles most cases
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({
        source: 'runtime',
        code: 'runtime-error',
        message: `Prop evaluation failed: ${msg}`,
      });
      runtimeErrors = errors;
      return parsed;
    }
  });

  // ─── Collect and fire onError ───
  let lastErrorKey = '';
  watchEffect(() => {
    if (isStreaming()) {
      // Clear stale errors from previous session so the correction loop
      // gets a clean signal when this streaming session completes.
      if (lastErrorKey !== '') {
        lastErrorKey = '';
        onError?.([]);
      }
      return;
    }
    // Track evaluated result + query snapshot like the upstream deps array.
    void evaluatedResult.value;
    const currentQuerySnapshot = querySnapshot.value;
    const errors: OpenUIError[] = [];

    // Parser exception (parser itself crashed)
    if (parseException) {
      errors.push(parseException);
    }

    // Parse failure — response exists but produced no renderable root
    const text = response();
    if (text && !result.value?.root && !parseException) {
      errors.push({
        source: 'parser',
        code: 'parse-failed',
        message: result.value
          ? 'Code parsed but produced no renderable root component'
          : 'Response could not be parsed as valid openui-lang',
        hint:
          `The entire response must be valid openui-lang code starting with root = ${
            library().root ?? 'Root'
          }(...)`,
      });
    }

    // Parser validation errors → enriched OpenUIError (with hints)
    if ((result.value?.meta?.errors?.length ?? 0) > 0) {
      errors.push(
        ...enrichErrors(
          result.value.meta.errors,
          library().toJSONSchema(),
          Object.keys(library().components),
        ),
      );
    }

    // Runtime eval errors (collected per-prop by evaluateElementProps)
    errors.push(...runtimeErrors);

    // Render errors (collected by error boundary via reportError)
    errors.push(...renderErrors);
    renderErrors = [];

    // Query/mutation tool errors — already OpenUIError, pass through directly
    errors.push(...(currentQuerySnapshot.__openui_errors ?? []));

    // Deduplicate — only fire when errors actually change
    const key = JSON.stringify(errors);
    if (key === lastErrorKey) return;
    lastErrorKey = key;

    // Fire onError or fall back to console.warn
    if (onError) {
      onError(errors);
    } else if (errors.length > 0) {
      for (const e of errors) {
        console.warn(`[openui] ${e.source}/${e.code}: ${e.message}`);
      }
    }
  });

  return {
    result: evaluatedResult,
    parseResult: result,
    contextValue,
    isQueryLoading,
  };
}
