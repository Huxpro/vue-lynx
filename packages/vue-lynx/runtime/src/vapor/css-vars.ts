// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ShadowElement } from '../shadow-element.js';

/** Apply CSS variables to a runtime-vapor root block without DOM APIs. */
export function applyVaporCssVarsToBlock(
  block: unknown,
  vars: Record<string, string>,
  seen: Set<object> = new Set(),
): void {
  if (block == null) return;
  if (block instanceof ShadowElement) {
    const setProperty = block.style.setProperty as (
      name: string,
      value: string,
    ) => void;
    for (const key in vars) setProperty(`--${key}`, vars[key]!);
    return;
  }
  if (Array.isArray(block)) {
    for (const child of block) applyVaporCssVarsToBlock(child, vars, seen);
    return;
  }
  if (typeof block !== 'object' || seen.has(block)) return;
  seen.add(block);

  const candidate = block as Record<string, unknown>;
  if ('block' in candidate) {
    applyVaporCssVarsToBlock(candidate.block, vars, seen);
  } else if ('nodes' in candidate) {
    applyVaporCssVarsToBlock(candidate.nodes, vars, seen);
  } else if ('anchor' in candidate) {
    applyVaporCssVarsToBlock(candidate.anchor, vars, seen);
  }
}
