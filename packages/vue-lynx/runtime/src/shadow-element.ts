// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * ShadowElement: a lightweight doubly-linked tree node that lives entirely in
 * the Background Thread.  It lets Vue's renderer call parentNode() / nextSibling()
 * synchronously, while the real Lynx elements exist only on the Main Thread.
 *
 * uid=1 is reserved for the page root (created via __CreatePage on Main Thread).
 * Regular elements start from uid=2.
 *
 * Besides the raw linked-list API consumed by the vdom renderer (node-ops.ts),
 * ShadowElement exposes a DOM-compatible surface (insertBefore, cloneNode,
 * setAttribute, className, style, addEventListener, …) consumed directly by
 * `@vue/runtime-vapor` in Vapor mode. The DOM-compatible mutators emit Main
 * Thread ops themselves (via tree-ops.ts), whereas the raw `_link`/`_unlink`
 * methods only update the shadow tree.
 */
import type {
  AnimationV2,
  NodesRef,
  SelectorQuery,
  uiMethodOptions,
} from '@lynx-js/types';

import { register, unregister } from './event-registry.js';
import { scheduleFlush } from './flush.js';
import { OP, pushOp } from './ops.js';
import { scopeIdToCssId } from './scope-bridge.js';
import {
  insertNode,
  parseInlineStyle,
  pushStyleOp,
  removeNode,
  resolveClass,
  setElementTextContent,
  setIdAttr,
} from './tree-ops.js';

// ---------------------------------------------------------------------------
// Event bindings (Vapor addEventListener path)
// ---------------------------------------------------------------------------

interface EventBinding {
  sign: string;
  /** 'bindEvent' | 'catchEvent' — decided by the first listener added. */
  type: string;
  handlers: Array<(data: unknown) => void>;
}

interface AddEventListenerOptionsLike {
  once?: boolean;
  capture?: boolean;
  passive?: boolean;
}

let _warnedCapture = false;

interface ClassListFacade {
  add(...cls: string[]): void;
  remove(...cls: string[]): void;
  toggle(cls: string, force?: boolean): boolean;
  contains(cls: string): boolean;
}

// ---------------------------------------------------------------------------
// style facade — the CSSStyleDeclaration subset that @vue/runtime-dom's
// patchStyle touches. Backed by the element's `_style` object; every
// mutation re-emits SET_STYLE.
// ---------------------------------------------------------------------------

const STYLE_METHODS = new Set([
  'getPropertyValue',
  'setProperty',
  'removeProperty',
  'item',
]);

function createStyleFacade(el: ShadowElement): Record<string, unknown> {
  const methods = {
    getPropertyValue(name: string): string {
      const v = el._style[name];
      return v == null ? '' : String(v);
    },
    setProperty(name: string, value: unknown, _priority?: string): void {
      if (value == null || value === '') {
        delete el._style[name];
      } else {
        el._style[name] = value;
      }
      if (!el._inert) pushStyleOp(el);
    },
    removeProperty(name: string): string {
      const prev = el._style[name];
      delete el._style[name];
      if (!el._inert) pushStyleOp(el);
      return prev == null ? '' : String(prev);
    },
    item(index: number): string {
      return Object.keys(el._style)[index] ?? '';
    },
  };

  return new Proxy(el._style, {
    get(_target, key: string | symbol) {
      if (typeof key !== 'string') return undefined;
      if (STYLE_METHODS.has(key)) {
        return methods[key as keyof typeof methods];
      }
      if (key === 'length') return Object.keys(el._style).length;
      if (key === 'cssText') {
        return Object.entries(el._style)
          .map(([k, v]) => `${k}:${v};`)
          .join('');
      }
      return el._style[key];
    },
    set(_target, key: string | symbol, value: unknown) {
      if (typeof key !== 'string') return true;
      if (key === 'cssText') {
        el._style = typeof value === 'string' ? parseInlineStyle(value) : {};
      } else if (value == null || value === '') {
        delete el._style[key];
      } else {
        el._style[key] = value;
      }
      if (!el._inert) pushStyleOp(el);
      return true;
    },
    // patchStyle probes `name in style` when auto-prefixing; claim support
    // for every property so it never rewrites names.
    has(_target, _key) {
      return true;
    },
  }) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// classList facade
// ---------------------------------------------------------------------------

function createClassList(el: ShadowElement): ClassListFacade {
  const classes = (): string[] => (el._baseClass ? el._baseClass.split(/\s+/) : []);
  const commit = (list: string[]): void => {
    el._baseClass = list.join(' ');
    if (!el._inert) {
      pushOp(OP.SET_CLASS, el.uid, resolveClass(el));
      scheduleFlush();
    }
  };
  return {
    add(...cls: string[]): void {
      const list = classes();
      for (const c of cls) {
        if (c && !list.includes(c)) list.push(c);
      }
      commit(list);
    },
    remove(...cls: string[]): void {
      commit(classes().filter((c) => !cls.includes(c)));
    },
    toggle(cls: string, force?: boolean): boolean {
      const has = classes().includes(cls);
      const shouldAdd = force ?? !has;
      if (shouldAdd && !has) this.add(cls);
      else if (!shouldAdd && has) this.remove(cls);
      return shouldAdd;
    },
    contains(cls: string): boolean {
      return classes().includes(cls);
    },
  };
}

export class ShadowElement {
  static nextUid = 2; // 1 is reserved for the page root

  uid: number;
  tag: string;
  parent: ShadowElement | null = null;
  firstChild: ShadowElement | null = null;
  lastChild: ShadowElement | null = null;
  prev: ShadowElement | null = null;
  next: ShadowElement | null = null;

  // Cached style object (last value passed to patchProp 'style').
  // Used by vShow to merge display:none without losing the original styles.
  _style: Record<string, unknown> = {};
  // Set to true by vShow when the element should be hidden.
  _vShowHidden = false;

  // Class management for Transition support.
  // _baseClass: the class string set by the user via :class / class prop.
  // _transitionClasses: classes added/removed by <Transition> hooks.
  // The effective class sent to MT = _baseClass + _transitionClasses joined.
  _baseClass = '';
  _transitionClasses: Set<string> = new Set();

  // v-model state (BG-thread bookkeeping)
  _vModelValue: string | undefined = undefined;
  _vModelHandler: ((data: unknown) => void) | undefined = undefined;
  _vModelEventProp: string | undefined = undefined;

  // ID for Teleport target resolution (idRegistry lookup).
  _id: string | undefined = undefined;

  // --- Vapor / DOM-compat state --------------------------------------------

  /** Text content for '#text' / '#comment' nodes (and setElementText). */
  _text: string | undefined = undefined;
  /** Generic attributes set via setAttribute (excluding class/style/id). */
  _attrs: Map<string, string> | undefined = undefined;
  /** Lynx cssIds applied via scoped-CSS data-v-* attributes. */
  _scopeIds: number[] | undefined = undefined;
  /** DOM-ish `value` property (input elements). */
  _valueProp: string | undefined = undefined;
  /** Lazily created CSSStyleDeclaration facade. */
  _styleFacade: Record<string, unknown> | undefined = undefined;
  /** Lazily created classList facade. */
  _classList: ClassListFacade | undefined = undefined;
  /** addEventListener bindings, keyed by Lynx event name. */
  _events: Map<string, EventBinding> | undefined = undefined;
  /**
   * Inert nodes are template prototypes created by the Vapor HTML parser;
   * they exist only on the Background Thread and never emit ops. Cloning an
   * inert node produces a live node (with ops).
   */
  _inert = false;

  constructor(tag: string, forceUid?: number) {
    if (forceUid === undefined) {
      this.uid = ShadowElement.nextUid++;
    } else {
      this.uid = forceUid;
    }
    this.tag = tag;
  }

  // ---------------------------------------------------------------------------
  // NodesRef — delegates to the real NodesRef returned by
  // lynx.createSelectorQuery().select(), using types from @lynx-js/types.
  // Each method targets this element via its unique `vue-ref-{uid}` attribute
  // (set on the MT side during element creation).
  // ---------------------------------------------------------------------------

  /** CSS attribute selector that uniquely identifies this element on MT. */
  get _selector(): string {
    return `[vue-ref-${this.uid}]`;
  }

  private _select(): NodesRef {
    return lynx.createSelectorQuery().select(this._selector);
  }

  invoke(options: uiMethodOptions): SelectorQuery {
    return this._select().invoke(options);
  }

  setNativeProps(
    nativeProps: Record<string, unknown>,
  ): SelectorQuery {
    return this._select().setNativeProps(nativeProps);
  }

  fields(
    fieldsParam: Record<string, boolean>,
    callback: (
      data: Record<string, unknown> | null,
      status: { data: string; code: number },
    ) => void,
  ): SelectorQuery {
    return this._select().fields(fieldsParam, callback);
  }

  path(
    callback: (
      data: unknown,
      status: { data: string; code: number },
    ) => void,
  ): SelectorQuery {
    return this._select().path(callback);
  }

  animate(animations: AnimationV2[] | AnimationV2): SelectorQuery {
    return this._select().animate(animations);
  }

  playAnimation(ids: string[] | string): SelectorQuery {
    return this._select().playAnimation(ids);
  }

  pauseAnimation(ids: string[] | string): SelectorQuery {
    return this._select().pauseAnimation(ids);
  }

  cancelAnimation(ids: string[] | string): SelectorQuery {
    return this._select().cancelAnimation(ids);
  }

  // ---------------------------------------------------------------------------
  // Raw shadow-tree linking — no ops emitted. Used by node-ops.ts (which
  // emits ops itself) and by the Vapor HTML parser (inert prototypes).
  // ---------------------------------------------------------------------------

  _link(child: ShadowElement, anchor: ShadowElement | null): void {
    // Detach from current parent first
    if (child.parent) {
      child.parent._unlink(child);
    }
    child.parent = this;

    if (anchor) {
      // Insert before anchor
      const prev = anchor.prev;
      child.next = anchor;
      child.prev = prev;
      anchor.prev = child;
      if (prev) {
        prev.next = child;
      } else {
        this.firstChild = child;
      }
    } else {
      // Append at end
      if (this.lastChild) {
        this.lastChild.next = child;
        child.prev = this.lastChild;
      } else {
        this.firstChild = child;
        child.prev = null;
      }
      this.lastChild = child;
      child.next = null;
    }
  }

  _unlink(child: ShadowElement): void {
    const prev = child.prev;
    const next = child.next;
    if (prev) {
      prev.next = next;
    } else {
      this.firstChild = next;
    }
    if (next) {
      next.prev = prev;
    } else {
      this.lastChild = prev;
    }
    child.parent = null;
    child.prev = null;
    child.next = null;
  }

  // ===========================================================================
  // DOM-compatible surface — consumed by @vue/runtime-vapor.
  // Mutators emit Main Thread ops (except on inert template prototypes).
  // ===========================================================================

  // --- traversal -------------------------------------------------------------

  get nodeType(): number {
    switch (this.tag) {
      case '#text':
        return 3;
      case '#comment':
        return 8;
      case '#fragment':
        return 11;
      default:
        return 1;
    }
  }

  get parentNode(): ShadowElement | null {
    return this.parent;
  }

  get parentElement(): ShadowElement | null {
    return this.parent;
  }

  get nextSibling(): ShadowElement | null {
    return this.next;
  }

  get previousSibling(): ShadowElement | null {
    return this.prev;
  }

  get childNodes(): ShadowElement[] {
    const out: ShadowElement[] = [];
    let child = this.firstChild;
    while (child) {
      out.push(child);
      child = child.next;
    }
    return out;
  }

  hasChildNodes(): boolean {
    return this.firstChild !== null;
  }

  contains(other: unknown): boolean {
    let node = other as ShadowElement | null;
    while (node) {
      if (node === this) return true;
      node = node.parent;
    }
    return false;
  }

  get tagName(): string {
    return this.tag.toUpperCase();
  }

  get localName(): string {
    return this.tag;
  }

  get namespaceURI(): string | null {
    return null;
  }

  get ownerDocument(): unknown {
    return (globalThis as { document?: unknown }).document ?? null;
  }

  // --- text ------------------------------------------------------------------

  /** Character data for text/comment nodes. */
  get nodeValue(): string | null {
    return this.nodeType === 1 ? null : this._text ?? '';
  }

  set nodeValue(value: string | null) {
    const text = value ?? '';
    this._text = text;
    if (this.tag === '#text' && !this._inert) {
      pushOp(OP.SET_TEXT, this.uid, text);
      scheduleFlush();
    }
  }

  /** `data` — CharacterData alias for nodeValue (comments/text). */
  get data(): string {
    return this._text ?? '';
  }

  set data(value: string) {
    this.nodeValue = value;
  }

  get textContent(): string {
    if (this.nodeType !== 1 && this.nodeType !== 11) return this._text ?? '';
    let out = '';
    let child = this.firstChild;
    while (child) {
      out += child.textContent;
      child = child.next;
    }
    // Elements can also carry direct text via SET_TEXT (setElementText).
    if (out === '' && this._text != null) out = this._text;
    return out;
  }

  set textContent(value: string | null) {
    const text = value ?? '';
    if (this.nodeType === 1 || this.nodeType === 11) {
      this._text = text === '' ? undefined : text;
      if (this._inert) {
        // Prototype: just drop children.
        while (this.firstChild) this._unlink(this.firstChild);
      } else {
        setElementTextContent(this, text);
      }
    } else {
      this.nodeValue = text;
    }
  }

  // --- structure ---------------------------------------------------------------

  insertBefore<T extends ShadowElement>(child: T, anchor?: ShadowElement | null): T {
    if (this._inert) {
      this._link(child, anchor ?? null);
      child._inert = true;
    } else {
      insertNode(child, this, anchor ?? null);
    }
    return child;
  }

  appendChild<T extends ShadowElement>(child: T): T {
    return this.insertBefore(child, null);
  }

  removeChild<T extends ShadowElement>(child: T): T {
    if (this._inert) {
      this._unlink(child);
    } else {
      removeNode(child);
    }
    return child;
  }

  /** DOM `node.remove()` — detach self from parent. */
  remove(): void {
    if (this.parent) {
      if (this.parent._inert || this._inert) {
        this.parent._unlink(this);
      } else {
        removeNode(this);
      }
    }
  }

  /**
   * Clone this node. Cloning a node (inert template prototypes included)
   * produces a live node: CREATE/SET ops are emitted for the entire subtree
   * so the Main Thread materialises it (detached until inserted).
   */
  cloneNode(deep?: boolean): ShadowElement {
    const clone = new ShadowElement(this.tag);

    if (this.tag === '#text') {
      clone._text = this._text;
      pushOp(OP.CREATE_TEXT, clone.uid);
      if (this._text) pushOp(OP.SET_TEXT, clone.uid, this._text);
    } else if (this.tag === '#comment') {
      clone._text = this._text;
      pushOp(OP.CREATE, clone.uid, '__comment');
    } else {
      pushOp(OP.CREATE, clone.uid, this.tag);
      if (this._baseClass) {
        clone._baseClass = this._baseClass;
        pushOp(OP.SET_CLASS, clone.uid, this._baseClass);
      }
      if (Object.keys(this._style).length > 0) {
        clone._style = { ...this._style };
        pushOp(OP.SET_STYLE, clone.uid, clone._style);
      }
      if (this._scopeIds) {
        clone._scopeIds = [...this._scopeIds];
        for (const cssId of clone._scopeIds) {
          pushOp(OP.SET_SCOPE_ID, clone.uid, cssId);
        }
      }
      if (this._attrs) {
        clone._attrs = new Map(this._attrs);
        for (const [key, value] of clone._attrs) {
          pushOp(OP.SET_PROP, clone.uid, key, value);
        }
      }
      if (this._id !== undefined) {
        // Emits SET_ID and registers in the Teleport id registry.
        setIdAttr(clone, this._id);
      }
      if (this._text != null) {
        pushOp(OP.SET_TEXT, clone.uid, this._text);
      }
    }

    if (deep) {
      let child = this.firstChild;
      while (child) {
        const childClone = child.cloneNode(true);
        clone._link(childClone, null);
        pushOp(OP.INSERT, clone.uid, childClone.uid, -1);
        child = child.next;
      }
    }

    scheduleFlush();
    return clone;
  }

  // --- attributes --------------------------------------------------------------

  setAttribute(key: string, value: unknown): void {
    const strValue = value == null ? '' : String(value);
    if (this._inert) {
      // Template prototype: record only; ops are emitted on clone.
      this._setAttrRecord(key, strValue);
      return;
    }
    if (key === 'class') {
      this._baseClass = strValue;
      pushOp(OP.SET_CLASS, this.uid, resolveClass(this));
      scheduleFlush();
    } else if (key === 'style') {
      this._style = parseInlineStyle(strValue);
      pushStyleOp(this);
    } else if (key === 'id') {
      setIdAttr(this, strValue);
    } else if (key.startsWith('data-v-')) {
      // Vue scoped-CSS attribute → Lynx cssId.
      const cssId = scopeIdToCssId(key);
      (this._scopeIds ??= []).push(cssId);
      pushOp(OP.SET_SCOPE_ID, this.uid, cssId);
      scheduleFlush();
    } else {
      (this._attrs ??= new Map()).set(key, strValue);
      pushOp(OP.SET_PROP, this.uid, key, value);
      scheduleFlush();
    }
  }

  /** Record an attribute on an inert prototype (parser / template path). */
  _setAttrRecord(key: string, value: string): void {
    if (key === 'class') {
      this._baseClass = value;
    } else if (key === 'style') {
      this._style = parseInlineStyle(value);
    } else if (key === 'id') {
      this._id = value;
    } else if (key.startsWith('data-v-')) {
      (this._scopeIds ??= []).push(scopeIdToCssId(key));
    } else {
      (this._attrs ??= new Map()).set(key, value);
    }
  }

  removeAttribute(key: string): void {
    if (key === 'class') {
      this._baseClass = '';
      if (!this._inert) {
        pushOp(OP.SET_CLASS, this.uid, resolveClass(this));
        scheduleFlush();
      }
    } else if (key === 'style') {
      this._style = {};
      if (!this._inert) pushStyleOp(this);
    } else if (key === 'id') {
      if (this._inert) {
        this._id = undefined;
      } else {
        setIdAttr(this, null);
      }
    } else {
      this._attrs?.delete(key);
      if (!this._inert) {
        pushOp(OP.SET_PROP, this.uid, key, null);
        scheduleFlush();
      }
    }
  }

  getAttribute(key: string): string | null {
    if (key === 'class') return this._baseClass || null;
    if (key === 'id') return this._id ?? null;
    if (key === 'style') {
      const entries = Object.entries(this._style);
      if (entries.length === 0) return null;
      return entries.map(([k, v]) => `${k}:${v};`).join('');
    }
    return this._attrs?.get(key) ?? null;
  }

  hasAttribute(key: string): boolean {
    return this.getAttribute(key) != null;
  }

  // --- class / style -------------------------------------------------------------

  get className(): string {
    return this._baseClass;
  }

  set className(value: string) {
    this._baseClass = value ?? '';
    if (!this._inert) {
      pushOp(OP.SET_CLASS, this.uid, resolveClass(this));
      scheduleFlush();
    }
  }

  get classList(): ClassListFacade {
    return this._classList ??= createClassList(this);
  }

  get style(): Record<string, unknown> {
    return this._styleFacade ??= createStyleFacade(this);
  }

  // --- value (input elements) ------------------------------------------------------

  get value(): string {
    return this._valueProp ?? '';
  }

  set value(v: unknown) {
    const strValue = v == null ? '' : String(v);
    this._valueProp = strValue;
    if (!this._inert) {
      pushOp(OP.SET_PROP, this.uid, 'value', strValue);
      scheduleFlush();
    }
  }

  // --- events ----------------------------------------------------------------------

  addEventListener(
    name: string,
    listener: (data: unknown) => void,
    options?: AddEventListenerOptionsLike | boolean,
  ): void {
    const opts: AddEventListenerOptionsLike = typeof options === 'boolean'
      ? { capture: options }
      : options ?? {};

    if (__DEV__ && opts.capture && !_warnedCapture) {
      _warnedCapture = true;
      console.warn(
        '[vue-lynx] addEventListener capture option is not supported on Lynx; '
        + 'the listener is registered for the bubbling phase.',
      );
    }

    let handler = listener;
    if (opts.once) {
      let called = false;
      handler = (data: unknown) => {
        if (called) return;
        called = true;
        this.removeEventListener(name, listener);
        listener(data);
      };
      // Keep identity linkage for removeEventListener(listener).
      (handler as { _original?: unknown })._original = listener;
    }

    const events = this._events ??= new Map();
    const existing = events.get(name);
    if (existing) {
      existing.handlers.push(handler);
      return;
    }

    // `.stop`-modified handlers are tagged by withModifiers so we can use
    // Lynx's catchEvent (native stop-propagation).
    const eventType = (listener as { _lynxCatch?: boolean })._lynxCatch
      ? 'catchEvent'
      : 'bindEvent';

    const binding: EventBinding = { sign: '', type: eventType, handlers: [handler] };
    const dispatcher = (data: unknown): void => {
      // Snapshot so once-removal during dispatch is safe.
      for (const fn of [...binding.handlers]) fn(data);
    };
    binding.sign = register(dispatcher);
    events.set(name, binding);
    pushOp(OP.SET_EVENT, this.uid, eventType, name, binding.sign);
    scheduleFlush();
  }

  removeEventListener(name: string, listener: (data: unknown) => void): void {
    const binding = this._events?.get(name);
    if (!binding) return;
    binding.handlers = binding.handlers.filter(
      (fn) =>
        fn !== listener
        && (fn as { _original?: unknown })._original !== listener,
    );
    if (binding.handlers.length === 0) {
      unregister(binding.sign);
      this._events!.delete(name);
      pushOp(OP.REMOVE_EVENT, this.uid, binding.type, name);
      scheduleFlush();
    }
  }

  /** Release event-registry entries for this subtree (unmount cleanup). */
  _releaseEvents(): void {
    if (this._events) {
      for (const binding of this._events.values()) {
        unregister(binding.sign);
      }
      this._events.clear();
    }
    let child = this.firstChild;
    while (child) {
      child._releaseEvents();
      child = child.next;
    }
  }
}

export const PAGE_ROOT_ID = 1;

/** Create the page root shadow element with the reserved uid=1. */
export function createPageRoot(): ShadowElement {
  return new ShadowElement('page', PAGE_ROOT_ID);
}
