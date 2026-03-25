/**
 * Bridge module that makes Vue runtime-dom test patterns work against
 * the Lynx BG→MT→PAPI→jsdom pipeline.
 *
 * Key mechanisms:
 * 1. Lazy shadow mapping — tests create jsdom elements normally via
 *    document.createElement; the bridge creates a ShadowElement on first
 *    patchProp call and maps it to the jsdom element in the MT elements Map.
 * 2. patchProp routing — routes through our real nodeOps.patchProp (which
 *    pushes ops) then sync-flushes: takeOps → applyOps on MT → PAPI → jsdom.
 * 3. Event forwarding — adds plain DOM listeners so tests can use
 *    el.dispatchEvent(new Event('click')) and have handlers fire.
 */

import {
  ShadowElement,
  nodeOps,
  takeOps,
  resetForTesting,
} from 'vue-lynx';
import { isBooleanAttr, includeBooleanAttr, isKnownHtmlAttr, isKnownSvgAttr } from '@vue/shared';

// ---------------------------------------------------------------------------
// Bridge internals – injected by the setup file
// ---------------------------------------------------------------------------

let _applyOps: (ops: unknown[]) => void;
let _elements: Map<number, unknown>;
let _resetMainThreadState: () => void;

const jsdomToShadow = new WeakMap<Element, ShadowElement>();
const idToShadow = new Map<number, ShadowElement>();

// Track DOM event forwarders (click → bindEvent:click) per element per Vue key
const domListeners = new WeakMap<
  Element,
  Map<string, EventListenerOrEventListenerObject>
>();

/**
 * Must be called by the setup file after importing the main-thread module.
 */
export function initBridge(deps: {
  applyOps: (ops: unknown[]) => void;
  elements: Map<number, unknown>;
  resetMainThreadState: () => void;
}): void {
  _applyOps = deps.applyOps;
  _elements = deps.elements;
  _resetMainThreadState = deps.resetMainThreadState;
}

// ---------------------------------------------------------------------------
// Sync flush — bypass the callLepusMethod scheduler
// ---------------------------------------------------------------------------

function syncFlush(): void {
  const ops = takeOps();
  if (ops.length === 0) return;

  const env = (globalThis as Record<string, unknown>)['lynxTestingEnv'] as {
    switchToMainThread(): void;
    switchToBackgroundThread(): void;
  };
  env.switchToMainThread();
  _applyOps(ops);
  env.switchToBackgroundThread();
}

// ---------------------------------------------------------------------------
// Lazy shadow mapping
// ---------------------------------------------------------------------------

/**
 * Ensure a ShadowElement exists for the given jsdom element.
 * On first call, creates a ShadowElement and registers the jsdom element
 * in the MT elements Map so applyOps can find it by ID.
 */
function ensureShadow(el: Element): ShadowElement {
  let shadow = jsdomToShadow.get(el);
  if (!shadow) {
    const tag = (el as any).tagName?.toLowerCase() ?? 'div';
    shadow = new ShadowElement(tag);
    idToShadow.set(shadow.id, shadow);
    jsdomToShadow.set(el, shadow);
    // Register existing jsdom element in the MT elements map
    // so applyOps can resolve ops targeting this element ID.
    _elements.set(shadow.id, el);
  }
  return shadow;
}

// ---------------------------------------------------------------------------
// Event key helpers
// ---------------------------------------------------------------------------

/**
 * Extract the raw DOM event name from a Vue on-prefixed key.
 * Returns null if the key is not an event key.
 *
 * Examples:
 *   'onClick'        → 'click'
 *   'onClickCapture' → 'click'
 *   'onClickOnce'    → 'click'
 *   'onUpdate:modelValue' → null (not a DOM event)
 *   'onclick'        → 'click' (native lowercase form)
 */
function parseEventKey(key: string): {
  name: string;
  once: boolean;
  capture: boolean;
} | null {
  // Vue runtime-dom on[A-Z]... pattern
  if (/^on[A-Z]/.test(key)) {
    let raw = key.slice(2);
    // Extract modifiers
    const once = raw.includes('Once');
    const capture = raw.includes('Capture');
    raw = raw.replace(/Once|Capture/g, '');
    const name = raw.charAt(0).toLowerCase() + raw.slice(1);
    return { name, once, capture };
  }
  // Native onclick (lowercase)
  if (/^on[a-z]/.test(key)) {
    return { name: key.slice(2), once: false, capture: false };
  }
  return null;
}

/**
 * Map a Vue event key to the PAPI eventMap key.
 * Mirrors parseEventProp in runtime/src/node-ops.ts — same slice logic so
 * the key we look up in el.eventMap matches what __AddEvent stored.
 */
function vueKeyToPapiKey(key: string): string | null {
  if (/^on[A-Z]/.test(key)) {
    const name = key.slice(2, 3).toLowerCase() + key.slice(3);
    return `bindEvent:${name}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Post-pipeline DOM property shim
// ---------------------------------------------------------------------------

// Tags where width/height must be set as attributes, not properties.
const EMBEDDED_TAGS = new Set([
  'img', 'video', 'canvas', 'source', 'embed', 'object',
]);

/**
 * After the pipeline sets attributes via PAPI's __SetAttribute, this shim
 * corrects jsdom element state for props that must be DOM properties.
 * Mirrors Vue runtime-dom's shouldSetAsProp / patchDOMProp logic.
 */
function patchDOMProp(
  el: Element,
  key: string,
  _prevValue: unknown,
  nextValue: unknown,
): void {
  const tag = el.tagName.toLowerCase();

  // .prop / ^attr modifiers are handled before the pipeline call,
  // so they never reach here.

  // width/height on embedded tags must be attributes (already done by pipeline)
  if ((key === 'width' || key === 'height') && EMBEDDED_TAGS.has(tag)) {
    // Ensure removal on null
    if (nextValue == null) el.removeAttribute(key);
    return;
  }

  // form is a readonly property on inputs; always use attribute
  if (key === 'form') {
    if (nextValue == null) el.removeAttribute(key);
    return;
  }

  // translate is an enumerated attribute; keep as attribute
  if (key === 'translate') {
    return;
  }

  // type on textarea is readonly; skip silently (Vue does the same)
  if (key === 'type' && tag === 'textarea') {
    return;
  }

  // Check if this key is a settable DOM property
  if (!(key in el)) {
    // Not a DOM property -- the pipeline's setAttribute is sufficient.
    // Handle removal: null/undefined should remove the attribute.
    if (nextValue == null) {
      el.removeAttribute(key);
    }
    return;
  }

  // At this point, key is a DOM property on the element.
  // Determine the current type for proper null handling.
  const currentValue = (el as any)[key];
  const propType = typeof currentValue;

  // For readonly properties, try setting and catch TypeError
  let needsWarn = false;

  if (nextValue != null) {
    try {
      (el as any)[key] = nextValue;
    } catch {
      needsWarn = true;
    }
  } else {
    // null/undefined: reset to type-appropriate default and remove attribute.
    // Vue runtime-dom resets string props to '', boolean to false, and
    // leaves number/object props alone (just removes the attribute).
    try {
      if (propType === 'boolean') {
        (el as any)[key] = false;
      } else if (propType === 'string') {
        (el as any)[key] = '';
      } else if (propType !== 'number') {
        // Non-string/boolean/number props (srcObject, etc.) reset to null
        (el as any)[key] = null;
      }
      // Number props: just removeAttribute below, don't set to 0
      // (e.g. input.size = 0 throws in jsdom)
    } catch {
      needsWarn = true;
    }
    el.removeAttribute(key);
  }

  // Store non-string values as _value (Vue's convention for input.value)
  if (key === 'value' && typeof nextValue !== 'string' && nextValue != null) {
    (el as any)._value = nextValue;
  }

  // Emit Vue-style warning for TypeError (test assertion expects this)
  if (needsWarn) {
    console.warn(
      `[Vue warn]: Failed setting prop "${key}" on <${tag}>`,
    );
  }
}

// ---------------------------------------------------------------------------
// patchProp — the main bridge function
// ---------------------------------------------------------------------------

/**
 * Drop-in replacement for Vue runtime-dom's patchProp.
 * Routes through our nodeOps.patchProp + PAPI pipeline, and adds
 * plain DOM event listeners for test compatibility.
 */
export function patchProp(
  el: Element,
  key: string,
  prevValue: unknown,
  nextValue: unknown,
  _namespace?: string,
  _parentComponent?: unknown,
): void {
  const shadow = ensureShadow(el);

  // Pre-process: handle null for class/id (our pipeline sets literal 'null')
  if (key === 'class' && nextValue == null) {
    // Clear class by setting empty string directly via PAPI
    el.className = '';
    // Still push through pipeline for consistency tracking
    nodeOps.patchProp(shadow, key, prevValue, '');
    syncFlush();
    // Override: PAPI's __SetClasses would set '' which is correct
    return;
  }
  if (key === 'id' && nextValue == null) {
    // Vue runtime-dom resets id to '' and removes the attribute.
    // Our pipeline's __SetID(el, '') would re-create the attribute,
    // so we handle this case directly and drain any ops.
    el.removeAttribute('id');
    takeOps(); // drain any pending ops
    return;
  }

  // Pre-process: handle null/undefined style (clear all styles)
  if (key === 'style' && nextValue == null) {
    if (typeof (el as any).removeAttribute === 'function') {
      (el as HTMLElement).removeAttribute('style');
    }
    takeOps(); // drain any pending ops
    return;
  }

  // Pre-process: handle string style (set cssText directly)
  if (key === 'style' && typeof nextValue === 'string') {
    // Skip if prev === next (Vue runtime-dom optimization)
    if (prevValue === nextValue) return;
    (el as HTMLElement).style.cssText = nextValue;
    // Also route through pipeline for tracking
    nodeOps.patchProp(shadow, key, prevValue, {});
    syncFlush();
    return;
  }

  // Pre-process: for style objects, filter out undefined/null values
  // to prevent jsdom's CSS parser from throwing, and clear old styles
  // since Object.assign is additive (won't remove stale properties).
  if (key === 'style' && nextValue != null && typeof nextValue === 'object') {
    // Clear all existing inline styles first so stale properties don't persist
    if (typeof (el as any).removeAttribute === 'function') {
      (el as HTMLElement).removeAttribute('style');
    }

    const cleaned: Record<string, unknown> = {};
    const customProps: [string, string][] = [];
    for (const [k, v] of Object.entries(nextValue as Record<string, unknown>)) {
      if (v != null) {
        if (k.startsWith('--')) {
          // CSS custom properties must use setProperty, not Object.assign
          customProps.push([k, String(v)]);
        } else {
          cleaned[k] = v;
        }
      }
    }
    nodeOps.patchProp(shadow, key, prevValue, cleaned);
    syncFlush();
    // Apply CSS custom properties via setProperty (Object.assign can't do this)
    for (const [prop, val] of customProps) {
      (el as HTMLElement).style.setProperty(prop, val);
    }
    return;
  }

  // Pre-process: boolean attributes (readonly, disabled, etc.)
  // Truthy → setAttribute(key, ''), falsy → removeAttribute(key)
  if (
    key !== 'style' && key !== 'class' && key !== 'id' && !key.startsWith('on')
    && isBooleanAttr(key)
  ) {
    const val = includeBooleanAttr(nextValue) ? '' : null;
    nodeOps.patchProp(shadow, key, prevValue, val);
    syncFlush();
    return;
  }

  // Pre-process: .prop modifier — force set as DOM property, skip pipeline
  // (setAttribute('.x') would throw InvalidCharacterError)
  if (key.startsWith('.')) {
    const propKey = key.slice(1);
    (el as any)[propKey] = nextValue;
    // Still route through pipeline with the real key for ops tracking
    nodeOps.patchProp(shadow, propKey, prevValue, nextValue);
    syncFlush();
    return;
  }

  // Pre-process: ^attr modifier — force set as attribute, skip pipeline
  if (key.startsWith('^')) {
    const attrKey = key.slice(1);
    if (nextValue != null) {
      el.setAttribute(attrKey, String(nextValue));
    } else {
      el.removeAttribute(attrKey);
    }
    nodeOps.patchProp(shadow, attrKey, prevValue, nextValue);
    syncFlush();
    return;
  }

  // Pre-process: detect event props and wrap array handlers.
  // register() in the event registry expects a single callable, so
  // array handlers (e.g. [fn1, fn2]) must be wrapped before nodeOps.
  const eventInfo = parseEventKey(key);
  if (eventInfo && Array.isArray(nextValue)) {
    const fns = nextValue as ((evt: unknown) => void)[];
    nextValue = (evt: unknown) => {
      for (const fn of fns) {
        if ((evt as any)?.cancelBubble) break;
        if (typeof fn === 'function') fn(evt);
      }
    };
  }

  // Route through our real nodeOps.patchProp (pushes ops)
  nodeOps.patchProp(shadow, key, prevValue, nextValue);

  // Sync-flush to apply ops via PAPI on the MT thread
  syncFlush();

  // Post-pipeline DOM property shim: PAPI only has __SetAttribute (string
  // setAttribute), but some HTML props must be set as DOM properties to
  // produce correct behavior (input.value, select.multiple, etc.). This
  // shim runs AFTER the full pipeline so ops serialization and cross-thread
  // transfer are still exercised. It only corrects the final jsdom state.
  if (!key.startsWith('on') && key !== 'class' && key !== 'style' && key !== 'id') {
    patchDOMProp(el, key, prevValue, nextValue);
  }

  // For events: manage DOM forwarders based on what the ops pipeline
  // produced in el.eventMap. This ensures event tests exercise the real
  // SET_EVENT / REMOVE_EVENT ops path instead of being masked by
  // independent listener management.
  if (eventInfo) {
    const papiKey = vueKeyToPapiKey(key);
    const forwarders = domListeners.get(el) ?? new Map();
    domListeners.set(el, forwarders);

    // Remove previous forwarder for this Vue key
    const prevForwarder = forwarders.get(key);
    if (prevForwarder) {
      el.removeEventListener(eventInfo.name, prevForwarder, {
        capture: eventInfo.capture,
      });
      forwarders.delete(key);
    }

    // If the ops pipeline registered a PAPI listener, add a thin DOM
    // forwarder so tests can use el.dispatchEvent(new Event('click')).
    // The forwarder dispatches the PAPI event name (e.g. 'bindEvent:click')
    // which triggers the PAPI listener → publishEvent → user handler.
    if (papiKey && (el as any).eventMap?.[papiKey]) {
      const targetPapiKey = papiKey;
      const forwarder = ((evt: Event) => {
        const papiListener = (el as any).eventMap?.[targetPapiKey];
        if (typeof papiListener === 'function') {
          papiListener(evt);
        }
      }) as EventListener;

      el.addEventListener(eventInfo.name, forwarder, {
        once: eventInfo.once,
        capture: eventInfo.capture,
      });
      forwarders.set(key, forwarder);
    }
  }
}

// ---------------------------------------------------------------------------
// patchEvent — thin wrapper for tests that import from modules/events
// ---------------------------------------------------------------------------

export function patchEvent(
  el: Element,
  rawName: string,
  prevValue: unknown,
  nextValue: unknown,
  _instance?: unknown,
): void {
  patchProp(el, rawName, prevValue, nextValue);
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

export function resetBridge(): void {
  idToShadow.clear();
  // domListeners is a WeakMap — self-cleans when elements are GC'd
  resetForTesting();
  _resetMainThreadState();
}

// ---------------------------------------------------------------------------
// Stub exports for runtime-dom internal imports
// ---------------------------------------------------------------------------

/** SVG namespace — tests using this are skipped (Lynx has no SVG). */
export const svgNS = 'http://www.w3.org/2000/svg';

/** Transition class key — not supported in Lynx. */
export const vtcKey: unique symbol = Symbol('__vTransitionClasses') as any;

/** ElementWithTransition type stub. */
export type ElementWithTransition = Element & {
  [key: symbol]: Set<string>;
};

/** XLink namespace — not supported in Lynx. */
export const xlinkNS = 'http://www.w3.org/1999/xlink';

// ---------------------------------------------------------------------------
// Re-exports from Vue core (for tests importing from '../src')
// ---------------------------------------------------------------------------

export {
  h,
  nextTick,
  ref,
  withDirectives,
  computed,
  reactive,
  watchEffect,
  defineComponent,
  onMounted,
  onUnmounted,
  onBeforeUpdate,
  onUpdated,
  Fragment,
  createApp,
} from '@vue/runtime-core';

export {
  vShow,
  vModelText,
  vModelCheckbox,
  vModelSelect,
  vModelRadio,
} from 'vue-lynx';

// withModifiers/withKeys: use the real @vue/runtime-dom implementations
// (vue-lynx exports stubs that just return fn without applying modifiers)
export { withModifiers, withKeys } from '@vue/runtime-dom';

/**
 * Stub render() — Vue runtime-dom tests that call render(h(...), container)
 * need the full component rendering pipeline. Those tests are skipped.
 */
export function render(): void {
  throw new Error(
    '[bridge] render() is not supported in runtime-dom bridge tests. '
      + 'Tests using render() should be added to the skiplist.',
  );
}
