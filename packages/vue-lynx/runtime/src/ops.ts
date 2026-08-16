// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export { OP } from 'vue-lynx/internal/ops';

let buffer: unknown[] = [];
let beforeTakeOpsHook: (() => void) | null = null;

export function setBeforeTakeOpsHook(hook: (() => void) | null): void {
  beforeTakeOpsHook = hook;
}

export function pushOp(...args: unknown[]): void {
  for (const arg of args) {
    buffer.push(arg);
  }
}

export function takeOps(): unknown[] {
  beforeTakeOpsHook?.();
  const b = buffer;
  buffer = [];
  return b;
}
