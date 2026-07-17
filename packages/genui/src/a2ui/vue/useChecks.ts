// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { computed, watchEffect } from '@vue/runtime-core';
import type { ComputedRef } from '@vue/runtime-core';

import { useA2UIContext, useFormContext } from './context.js';
import type { CatalogFunctionEntry } from '../catalog/defineCatalog.js';
import type { CheckFailure, CheckOutcome } from '../store/FormController.js';
import { executeFunctionCall } from '../store/index.js';
import type { MessageProcessor } from '../store/MessageProcessor.js';
import { resolveDynamicValue } from '../store/resolveDynamic.js';
import type { Surface } from '../store/types.js';
import { isDataBinding, isFunctionCall } from '../store/utils.js';

/**
 * A v0.9 `CheckRule` is `{ condition, message }` where `condition` is a
 * boolean, a `DataBinding`, or a `FunctionCall`. We accept the loose
 * `unknown` shape so component props don't have to import the v0_9
 * types just to pass them through.
 */
export interface CheckLike {
  condition: unknown;
  message: string;
}

function evaluateCondition(
  processor: MessageProcessor,
  condition: unknown,
  surfaceId: string,
  dataContextPath?: string,
  functions?: readonly CatalogFunctionEntry[],
): boolean {
  if (typeof condition === 'boolean') return condition;
  if (isFunctionCall(condition)) {
    const result = executeFunctionCall(
      processor,
      condition,
      surfaceId,
      dataContextPath,
      { functions },
    );
    return Boolean(result);
  }
  if (isDataBinding(condition)) {
    return Boolean(
      resolveDynamicValue(
        processor,
        condition,
        surfaceId,
        dataContextPath,
        {
          functions,
          resolveFunctionCall: executeFunctionCall,
        },
      ),
    );
  }
  // Unknown shape — treat as passing rather than blocking the user.
  return true;
}

function evaluateChecks(
  processor: MessageProcessor,
  checks: CheckLike[] | undefined,
  surface: Surface | undefined,
  dataContextPath?: string,
  functions?: readonly CatalogFunctionEntry[],
): CheckOutcome {
  if (!surface || !Array.isArray(checks) || checks.length === 0) {
    return { ok: true, failures: [] };
  }
  const failures: CheckFailure[] = [];
  for (const rule of checks) {
    const ok = evaluateCondition(
      processor,
      rule.condition,
      surface.surfaceId,
      dataContextPath,
      functions,
    );
    if (!ok) {
      failures.push({
        call: isFunctionCall(rule.condition)
          ? rule.condition.call
          : 'condition',
        message: rule.message,
      });
    }
  }
  return { ok: failures.length === 0, failures };
}

/**
 * Reactive outcome of an input component's `checks` array plus the first
 * failure message (handy for inline error rendering).
 */
export interface UseChecksResult {
  outcome: ComputedRef<CheckOutcome>;
  firstFailureMessage: ComputedRef<string | undefined>;
}

/**
 * Evaluate an input component's `checks` array reactively. When an enclosing
 * form controller exists (provided via `FormContextKey`), the input is also
 * registered with it so Buttons in the same form can react to `isValid`.
 */
export function useChecks(
  options: {
    checks: () => CheckLike[] | undefined;
    componentId: () => string;
    surface: () => Surface | undefined;
    dataContextPath?: () => string | undefined;
  },
): UseChecksResult {
  const { checks, componentId, surface, dataContextPath } = options;
  const ctx = useA2UIContext();
  const form = useFormContext();

  // Store-signal reads inside the computed make the outcome track
  // data-model changes natively (the upstream port re-evaluated inside a
  // Preact `effect`).
  const outcome = computed<CheckOutcome>(() =>
    evaluateChecks(
      ctx.processor,
      checks(),
      surface(),
      dataContextPath?.(),
      ctx.catalog.functions,
    )
  );

  if (form) {
    watchEffect((onCleanup) => {
      // Skip registration when no componentId is available — otherwise every
      // unnamed input collides under the same '' key in the form controller.
      const id = componentId();
      if (!id) return;
      onCleanup(form.setOutcome(id, outcome.value));
    });
  }

  return {
    outcome,
    firstFailureMessage: computed(() => outcome.value.failures[0]?.message),
  };
}
