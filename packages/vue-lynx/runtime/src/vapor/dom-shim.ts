// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * DOM globals shim for Vapor mode on the Lynx Background Thread.
 *
 * `@vue/runtime-vapor` is hard-wired to the DOM: it calls
 * `document.createElement/createTextNode/createComment/querySelector`,
 * parses template HTML through a `<template>` element's `innerHTML`, and
 * performs `instanceof Node/Element/Comment/Text` checks against globals.
 *
 * This module installs just enough globals for that code to run against the
 * ShadowElement tree:
 *
 *  - `document` — node factories mapped to the ops-emitting nodeOps, plus a
 *    `<template>` host whose `innerHTML` runs our own HTML parser and yields
 *    inert ShadowElement prototypes (see html-parser.ts)
 *  - `Node` / `Element` / `Comment` / `Text` / … — `Symbol.hasInstance`
 *    shims that classify ShadowElements by nodeType. Their prototypes are
 *    real objects, so runtime-vapor's `optimizePropertyLookup()` prototype
 *    warm-up is harmless.
 *  - `window` — alias of globalThis (dev-mode `window.ShadowRoot` probe in
 *    `normalizeContainer`)
 *
 * Install is idempotent and skips any global that already exists (e.g. a
 * jsdom test environment — where Vapor-on-Lynx is not supported anyway).
 */

import {
  VAPOR_DOCUMENT_GLOBAL,
  VAPOR_WINDOW_GLOBAL,
} from 'vue-lynx/internal/ops';
import { nodeOps } from '../node-ops.js';
import { ShadowElement } from '../shadow-element.js';
import { parseTemplate } from './html-parser.js';

// ---------------------------------------------------------------------------
// <template> host
// ---------------------------------------------------------------------------

/**
 * Stand-in for the DOM `<template>` element used by runtime-vapor's
 * `template()` helper:
 *
 *   t.innerHTML = html;
 *   node = t.content.firstChild;
 */
export class LynxTemplateHost {
  content: ShadowElement;

  constructor() {
    this.content = new ShadowElement('#fragment');
    this.content._inert = true;
  }

  set innerHTML(html: string) {
    this.content = parseTemplate(html);
  }

  get innerHTML(): string {
    return '';
  }
}

// ---------------------------------------------------------------------------
// document
// ---------------------------------------------------------------------------

function createLynxDocument(): Record<string, unknown> {
  return {
    createElement(tag: string): unknown {
      if (tag === 'template') return new LynxTemplateHost();
      return nodeOps.createElement(tag);
    },
    createElementNS(_ns: string, tag: string): unknown {
      return (this as { createElement(t: string): unknown }).createElement(tag);
    },
    createTextNode(text = ''): ShadowElement {
      return nodeOps.createText(text);
    },
    createComment(text = ''): ShadowElement {
      const comment = nodeOps.createComment(text);
      comment._text = text;
      return comment;
    },
    querySelector(selector: string): ShadowElement | null {
      return nodeOps.querySelector?.(selector) ?? null;
    },
    addEventListener(name: string): void {
      if (__DEV__) {
        console.warn(
          `[vue-lynx] document-level event delegation ("${name}") is not supported on Lynx. `
          + 'Compile Vapor components with eventDelegation: false (pluginVueLynx does this by default).',
        );
      }
    },
    removeEventListener(): void {
      /* no-op */
    },
  };
}

// ---------------------------------------------------------------------------
// DOM constructor shims (instanceof support via Symbol.hasInstance)
// ---------------------------------------------------------------------------

function classify(nodeTypes: number[] | null): (value: unknown) => boolean {
  return (value: unknown) =>
    value instanceof ShadowElement
    && (nodeTypes === null || nodeTypes.includes(value.nodeType));
}

function makeCtorShim(match: (value: unknown) => boolean): unknown {
  class DomCtorShim {
    static [Symbol.hasInstance](value: unknown): boolean {
      return match(value);
    }
  }
  return DomCtorShim;
}

// ---------------------------------------------------------------------------
// Delegated-event fallback accessors
//
// The vapor compiler's event-delegation mode assigns handlers directly as
// `el.$evtclick = invoker` expandos and relies on a document-level
// dispatcher. vue-lynx compiles with eventDelegation: false, but Vapor
// components precompiled elsewhere (npm libraries) may still carry these
// assignments. Prototype accessors for the fixed delegated-event set route
// them to regular per-element listeners.
// ---------------------------------------------------------------------------

const DELEGATED_EVENTS = [
  'beforeinput',
  'click',
  'dblclick',
  'contextmenu',
  'focusin',
  'focusout',
  'input',
  'keydown',
  'keyup',
  'mousedown',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'pointerdown',
  'pointermove',
  'pointerout',
  'pointerover',
  'pointerup',
  'touchend',
  'touchmove',
  'touchstart',
];

function installDelegatedEventAccessors(): void {
  const proto = ShadowElement.prototype as unknown as Record<string, unknown>;
  for (const name of DELEGATED_EVENTS) {
    const storeKey = `_$evt${name}`;
    Object.defineProperty(proto, `$evt${name}`, {
      configurable: true,
      get(this: Record<string, unknown>) {
        return this[storeKey];
      },
      set(this: ShadowElement & Record<string, unknown>, invoker: unknown) {
        // `optimizePropertyLookup()` assigns `void 0` on the prototype
        // itself as a shape warm-up — record it and do nothing else.
        const hadListener = this[storeKey] !== undefined;
        this[storeKey] = invoker;
        if (!hadListener && invoker && this instanceof ShadowElement) {
          this.addEventListener(name, (data: unknown) => {
            const handlers = this[storeKey];
            if (Array.isArray(handlers)) {
              for (const fn of handlers) (fn as (d: unknown) => void)(data);
            } else if (typeof handlers === 'function') {
              (handlers as (d: unknown) => void)(data);
            }
          });
        }
      },
    });
  }
}

// ---------------------------------------------------------------------------
// install
// ---------------------------------------------------------------------------

let installed = false;

/**
 * Install the Vapor DOM shim globals. Idempotent; never overwrites an
 * existing global of the same name.
 */
export function installVaporDomShim(): void {
  if (installed) return;
  installed = true;

  installDelegatedEventAccessors();

  const g = globalThis as Record<string, unknown>;

  const define = (name: string, value: unknown): void => {
    if (g[name] !== undefined) return;
    Object.defineProperty(g, name, {
      value,
      configurable: true,
      enumerable: false,
      writable: true,
    });
  };

  const lynxDocument = createLynxDocument();

  // Lynx's runtime wrapper injects `document`/`window` as function
  // parameters (undefined) that shadow the true globals in bundled code. The
  // vue-lynx plugin therefore rewrites free `document`/`window` references
  // to these keys at build time (vapor mode only); install them
  // unconditionally.
  define(VAPOR_DOCUMENT_GLOBAL, lynxDocument);
  define(VAPOR_WINDOW_GLOBAL, g);

  if (g.document !== undefined) {
    if (__DEV__) {
      console.warn(
        '[vue-lynx] A `document` global already exists — the Vapor DOM shim '
        + 'was not installed. Vapor mode requires the Lynx Background Thread '
        + 'environment (no real DOM).',
      );
    }
  } else {
    define('document', lynxDocument);
  }

  define('Node', makeCtorShim(classify(null)));
  define('Element', makeCtorShim(classify([1])));
  define('Text', makeCtorShim(classify([3])));
  define('Comment', makeCtorShim(classify([8])));
  define('CharacterData', makeCtorShim(classify([3, 8])));
  define('DocumentFragment', makeCtorShim(classify([11])));
  // Never matched — exist only so `instanceof` does not throw.
  define('HTMLElement', makeCtorShim(() => false));
  define('SVGElement', makeCtorShim(() => false));
  define('MathMLElement', makeCtorShim(() => false));
  define('HTMLSlotElement', makeCtorShim(() => false));
  define('ShadowRoot', makeCtorShim(() => false));

  // Dev-mode `window.ShadowRoot` probe in runtime-dom's normalizeContainer.
  define('window', g);
}

/** @internal test-only */
export function resetVaporDomShimForTesting(): void {
  installed = false;
}
