// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { getCurrentInstance } from '@vue/runtime-core';

const EMPTY_CSS_MODULE: Record<string, string> = Object.freeze({});

interface CssModuleComponent {
  __cssModules?: Record<string, Record<string, string>>;
}

/** Resolve a CSS module mapping injected onto the component by vue-loader. */
export function useCssModule(name = '$style'): Record<string, string> {
  const instance = getCurrentInstance();
  if (!instance) {
    if (__DEV__) console.warn('[vue-lynx] useCssModule must be called inside setup().');
    return EMPTY_CSS_MODULE;
  }

  const modules = (instance.type as CssModuleComponent).__cssModules;
  const module = modules?.[name];
  if (!module) {
    if (__DEV__) {
      console.warn(`[vue-lynx] Current instance does not have CSS module named "${name}".`);
    }
    return EMPTY_CSS_MODULE;
  }
  return module;
}
