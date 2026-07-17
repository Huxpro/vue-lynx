// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Build inert ShadowElement template prototypes from the build-time
 * structured form (issue #234, Part A).
 *
 * When the plugin's `vaporBuildTimeTemplates` flag is on, the compiler's
 * `template("<html>", flags)` calls are rewritten at build time to
 * `template([<VaporTemplateIR>], flags)`. This module reconstructs the inert
 * prototype directly from that IR — the exact tree the runtime HTML parser
 * (html-parser.ts) would have produced from the string — so everything
 * downstream (buildStructure → REGISTER_TEMPLATE, buildShadowClone → the
 * pre-order uid contract) is byte-identical to the string-parsing path.
 *
 * The only thing skipped is the per-template HTML parse at startup.
 */

import type { VaporTemplateIR } from 'vue-lynx/internal/ops';
import { ShadowElement } from '../shadow-element.js';

function buildNode(node: VaporTemplateIR): ShadowElement {
  const tag = node[0];

  if (tag === '#text' || tag === '#comment') {
    const leaf = new ShadowElement(tag);
    leaf._inert = true;
    leaf._text = node[1] as string;
    return leaf;
  }

  const el = new ShadowElement(tag);
  el._inert = true;

  // Raw attribute list, replayed through the same chokepoint the parser used
  // (routes class/style/id/data-v-* exactly as _setAttrRecord does).
  const attrs = node[1] as [string, string][];
  for (const [key, value] of attrs) {
    el._setAttrRecord(key, value);
  }

  const children = node[2] as VaporTemplateIR[];
  for (const child of children) {
    el._link(buildNode(child), null);
  }
  return el;
}

/**
 * Reconstruct the inert `#fragment` prototype whose children are the template
 * root nodes — the structured-form counterpart of `parseTemplate(html)`.
 */
export function buildInertFromIR(nodes: VaporTemplateIR[]): ShadowElement {
  const fragment = new ShadowElement('#fragment');
  fragment._inert = true;
  for (const node of nodes) {
    fragment._link(buildNode(node), null);
  }
  return fragment;
}
