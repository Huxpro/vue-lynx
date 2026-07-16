// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type * as v0_9 from '@a2ui/web_core/v0_9';

import { useA2UIContext } from './context.js';
import { resolveDynamicValue } from '../store/resolveDynamic.js';
import { executeFunctionCall } from '../store/resolveFunctionCall.js';
import type { UserActionPayload } from '../store/types.js';

/**
 * Identifies the component and surface that emitted an A2UI action. Fields
 * arrive as getters so a long-lived `sendAction` always reads fresh values.
 */
export interface ActionProps {
  id: () => string;
  surfaceId: () => string;
  dataContext?: () => string | undefined;
}

/**
 * Create a `sendAction` callback that resolves dynamic action payload values
 * and dispatches user events or function calls through the current processor.
 */
export function useAction(
  props: ActionProps,
): { sendAction: (action: v0_9.Action) => Promise<unknown> } {
  const { id, surfaceId, dataContext } = props;
  const ctx = useA2UIContext();

  const sendAction = (action: v0_9.Action): Promise<unknown> => {
    const { catalog, processor } = ctx;
    const surfaceIdValue = surfaceId();
    const dataContextValue = dataContext?.();

    if ('functionCall' in action && action.functionCall) {
      return Promise.resolve(executeFunctionCall(
        processor,
        action.functionCall,
        surfaceIdValue,
        dataContextValue,
        { functions: catalog.functions },
      ));
    }

    let name = 'unknownAction';
    let context: Record<string, unknown> = {};

    if ('event' in action && action.event) {
      name = action.event.name;
      const ctxValues = action.event.context as
        | Record<string, unknown>
        | undefined;
      if (ctxValues) {
        const resolvedContext: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(ctxValues)) {
          resolvedContext[key] = resolveDynamicValue(
            processor,
            value,
            surfaceIdValue,
            dataContextValue,
            { functions: catalog.functions },
          );
        }
        context = resolvedContext;
      }
    }

    const userAction: UserActionPayload = {
      name,
      surfaceId: surfaceIdValue,
      sourceComponentId: id(),
      timestamp: new Date().toISOString(),
      context,
    };

    // Dispatch through the processor — `<A2UI>` listens via
    // `processor.onEvent` and forwards the action to its `onAction`
    // prop, which the developer wires to their agent.
    return processor.dispatch({ userAction });
  };

  return { sendAction };
}
