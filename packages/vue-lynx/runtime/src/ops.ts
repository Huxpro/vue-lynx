// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export { OP } from 'vue-lynx/internal/ops';

let buffer: unknown[] = [];

export function pushOp(...args: unknown[]): void {
  for (const arg of args) {
    buffer.push(arg);
  }
}

export function takeOps(): unknown[] {
  const b = buffer;
  buffer = [];
  return b;
}
