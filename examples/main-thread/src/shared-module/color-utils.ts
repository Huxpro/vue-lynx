// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Pure helper functions for color manipulation.
 *
 * This module is imported with `with { runtime: 'shared' }` so that its
 * exports can be called directly inside main thread functions without
 * needing the 'main thread' directive on each helper.
 */

/**
 * Cycle through a palette, returning the next color after the current one.
 */
export function nextColor(current: string, palette: string[]): string {
  const idx = palette.indexOf(current)
  return palette[(idx + 1) % palette.length]!
}

/**
 * Convert a hex color string to an rgba string with the given alpha.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
