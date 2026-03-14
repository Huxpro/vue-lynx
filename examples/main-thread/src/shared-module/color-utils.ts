// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Shared color utilities — available on both Main Thread and Background Thread.
 *
 * This module does NOT contain a 'main thread' directive. It is imported
 * with `with { runtime: 'shared' }` so that its code is included in both
 * thread bundles.
 */

const COLORS = ['#4FC3F7', '#81C784', '#FFB74D', '#E57373', '#BA68C8']

export function getNextColor(index: number): string {
  return COLORS[index % COLORS.length]!
}

export function getColorCount(): number {
  return COLORS.length
}
