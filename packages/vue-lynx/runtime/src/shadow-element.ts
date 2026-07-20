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
import type {
  TemplateNode,
  TemplateNodeProps,
} from 'vue-lynx/internal/ops';
import { inferHoleSlots, computeIfrNavSlots } from 'vue-lynx/internal/html-to-template-node';
import { isVaporIfrElementTemplates } from 'vue-lynx/internal/vapor-ifr-et';
import { patchEventProp } from './event-props.js';
import { scheduleFlush } from './flush.js';
import { isIfrMainThread } from './ifr-env.js';
import { applyMainThreadProp } from './main-thread-props.js';
import { OP, pushOp } from './ops.js';
import {
  normalizeStylePropertyName,
  normalizeStyleValue,
} from './style-normalization.js';
import {
  idRegistry,
  insertNode,
  parseInlineStyle,
  serializeInlineStyle,
  pushStyleOp,
  removeNode,
  resolveClass,
  setElementTextContent,
  setIdAttr,
  setTextNode,
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
      const v = el._style[normalizeStylePropertyName(name)];
      return v == null ? '' : String(v);
    },
    setProperty(name: string, value: unknown, _priority?: string): void {
      const property = normalizeStylePropertyName(name);
      if (value == null || value === '') {
        delete el._style[property];
      } else {
        el._style[property] = normalizeStyleValue(property, value);
      }
      if (!el._inert) pushStyleOp(el);
    },
    removeProperty(name: string): string {
      const property = normalizeStylePropertyName(name);
      const prev = el._style[property];
      delete el._style[property];
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
        return serializeInlineStyle(el._style);
      }
      return el._style[normalizeStylePropertyName(key)];
    },
    set(_target, key: string | symbol, value: unknown) {
      if (typeof key !== 'string') return true;
      if (key === 'cssText') {
        el._style = typeof value === 'string' ? parseInlineStyle(value) : {};
      } else {
        const property = normalizeStylePropertyName(key);
        if (value == null || value === '') {
          delete el._style[property];
        } else {
          el._style[property] = normalizeStyleValue(property, value);
        }
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

  /** @internal Native host nodes must retain object identity through Vue reactivity. */
  get __v_skip(): true {
    return true;
  }

  uid: number;
  tag: string;
  parent: ShadowElement | null = null;
  firstChild: ShadowElement | null = null;
  lastChild: ShadowElement | null = null;
  prev: ShadowElement | null = null;
  next: ShadowElement | null = null;

  // Empty Vue text VNodes are structural anchors. Native Lynx gives an empty
  // <text> a default line box, so #text nodes are materialised lazily, only
  // while they contain visible text (see tree-ops.ts). _mtCreated: the MT
  // element exists; _mtInserted: it is currently in the MT tree.
  _mtCreated = false;
  _mtInserted = false;

  // Cached style object (last value passed to patchProp 'style').
  // Used by vShow to merge display:none without losing the original styles.
  _style: Record<string, unknown> = {};
  // Set to true by vShow when the element should be hidden.
  _vShowHidden = false;

  // Class management for Transition support.
  // _baseClass: the class string set by the user via :class / class prop.
  // _scopeClasses: Vue's composable data-v-* scope tokens.
  // _transitionClasses: classes added/removed by <Transition> hooks.
  // The effective class sent to MT = base + scopes + transitions.
  _baseClass = '';
  _scopeClasses: Set<string> = new Set();
  _transitionClasses: Set<string> = new Set();

  // v-model state (BG-thread bookkeeping)
  _vModelValue: string | undefined = undefined;
  _vModelHandler: ((data: unknown) => void) | undefined = undefined;
  _vModelEventProp: string | undefined = undefined;

  // ID for Teleport target resolution (idRegistry lookup).
  _id: string | undefined = undefined;

  // Element-template instance state (only set on lowered template roots).
  // Hole shadows use contiguous uids after the root so both threads agree on
  // ids without shipping a per-hole mapping.
  _tplHoleKeys: string[] | undefined = undefined;
  _tplHoles: ShadowElement[] | undefined = undefined;

  // --- Vapor / DOM-compat state --------------------------------------------

  /** Text content for '#text' / '#comment' nodes (and setElementText). */
  _text: string | undefined = undefined;
  /** Generic attributes set via setAttribute (excluding class/style/id). */
  _attrs: Map<string, string> | undefined = undefined;
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
  /**
   * Set on a #text node that is the only child of an element: its text is
   * stored on the host element on the Main Thread (no separate text element
   * exists there). See cloneNode / _materializeAliasedText.
   */
  _textHost: ShadowElement | undefined = undefined;
  /** Back-reference from a host element to its aliased #text child. */
  _aliasedTextChild: ShadowElement | undefined = undefined;

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
    const text = String(value ?? '');
    this._text = text;
    if (this.tag !== '#text' || this._inert) return;
    // Aliased only-child text lives on the host element on the MT side.
    if (this._textHost) {
      pushOp(OP.SET_TEXT, this._textHost.uid, text);
      scheduleFlush();
      return;
    }
    setTextNode(this, text);
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
   * Clone this node. Cloning a node produces a live node: ops are emitted so
   * the Main Thread materialises it (detached until inserted).
   *
   * Template prototypes (inert, deep) take the fast path: the static
   * structure is REGISTER_TREE'd once, and each instance is a single
   * CLONE_TREE op with a deterministic contiguous uid block — instead of
   * re-serializing the identical CREATE/SET/INSERT sequence per instance.
   */
  cloneNode(deep?: boolean): ShadowElement {
    if (deep && this._inert && this.nodeType === 1) {
      return cloneTemplatePrototype(this);
    }
    return this._cloneNodeGranular(deep);
  }

  /** Per-node op emission clone — non-template clones (live nodes). */
  _cloneNodeGranular(deep?: boolean): ShadowElement {
    const clone = new ShadowElement(this.tag);

    if (this.tag === '#text') {
      clone._text = this._text;
      // Lazy materialisation: empty text clones stay BG-only anchors.
      if (this._text) {
        pushOp(OP.CREATE_TEXT, clone.uid);
        pushOp(OP.SET_TEXT, clone.uid, this._text);
        clone._mtCreated = true;
      }
    } else if (this.tag === '#comment') {
      // Comments never reach the Main Thread.
      clone._text = this._text;
    } else {
      pushOp(OP.CREATE, clone.uid, this.tag);
      clone._baseClass = this._baseClass;
      clone._scopeClasses = new Set(this._scopeClasses);
      const resolvedClass = resolveClass(clone);
      if (resolvedClass) pushOp(OP.SET_CLASS, clone.uid, resolvedClass);
      if (Object.keys(this._style).length > 0) {
        clone._style = { ...this._style };
        pushOp(OP.SET_STYLE, clone.uid, clone._style);
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
      // Fast path: an element whose only child is a #text node does not need
      // a separate Main Thread text element — set the text on the element
      // itself (exactly what the vdom renderer's setElementText does). This
      // cuts per-instance template-clone traffic by ~30% (CREATE_TEXT +
      // INSERT + placeholder SET_TEXT per text cell). The shadow #text node
      // still exists on the BG thread (vapor's txt()/setText target it) but
      // is aliased: its writes route to the host, and it is lazily
      // materialized if the host ever gains additional children.
      const only = this.firstChild;
      if (
        clone.nodeType === 1
        && only !== null
        && only.next === null
        && only.tag === '#text'
      ) {
        const textClone = new ShadowElement('#text');
        textClone._text = only._text;
        textClone._textHost = clone;
        clone._aliasedTextChild = textClone;
        clone._link(textClone, null);
        // The compiler's dynamic-interpolation placeholder is a single
        // space; a renderEffect overwrites it immediately, so skip it.
        if (only._text != null && only._text !== ' ') {
          pushOp(OP.SET_TEXT, clone.uid, only._text);
        }
      } else {
        let child = this.firstChild;
        while (child) {
          const childClone = child.cloneNode(true);
          clone._link(childClone, null);
          // Shadow-only anchors (comments, empty text) and <list> text
          // children have no MT element to insert.
          if (
            childClone.tag !== '#comment'
            && !(childClone.tag === '#text'
              && (!childClone._mtCreated || clone.tag === 'list'))
          ) {
            pushOp(OP.INSERT, clone.uid, childClone.uid, -1);
            if (childClone.tag === '#text') childClone._mtInserted = true;
          }
          child = child.next;
        }
      }
    }

    scheduleFlush();
    return clone;
  }

  /**
   * Materialize an aliased only-child #text node as a real Main Thread text
   * element. Called before any structural mutation of the host so that
   * sibling inserts/removals see a fully materialized child list.
   */
  _materializeAliasedText(): void {
    const aliased = this._aliasedTextChild;
    if (!aliased) return;
    this._aliasedTextChild = undefined;
    aliased._textHost = undefined;
    if (this._inert) return;
    // Clear the host-level text; the text (if any) moves to a real child
    // node. An empty aliased text stays a BG-only anchor (lazy).
    pushOp(OP.SET_TEXT, this.uid, '');
    if (aliased._text) {
      pushOp(OP.CREATE_TEXT, aliased.uid);
      pushOp(OP.SET_TEXT, aliased.uid, aliased._text);
      aliased._mtCreated = true;
      pushOp(OP.INSERT, this.uid, aliased.uid, -1);
      aliased._mtInserted = true;
    }
    scheduleFlush();
  }

  // --- attributes --------------------------------------------------------------

  setAttribute(key: string, value: unknown): void {
    // runtime-vapor adds this browser-only mount marker to its container.
    // The Lynx page root is not a DOM element, so do not emit a native prop
    // or misclassify the marker as a scoped-CSS class. Preserve normal
    // data-v-app attribute behavior on user-created elements.
    if (this.uid === PAGE_ROOT_ID && key === 'data-v-app') return;
    if (!this._inert && applyMainThreadProp(this, key, value)) return;
    // Vapor compiles ReactLynx-style event props (`:bindtap="fn"`,
    // `:catchtap="fn"`, …) to plain attribute writes — including
    // runtime-vapor's internal paths (fallthrough attrs, v-bind spreads),
    // which all funnel through setAttribute. Function values on
    // event-shaped keys register native Lynx events, mirroring the vdom
    // renderer's patchProp.
    if (
      !this._inert
      && typeof value === 'function'
      && patchEventProp(this, key, value)
    ) {
      return;
    }
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
      this._addScopeClass(key);
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
      this._addScopeClass(key);
    } else {
      (this._attrs ??= new Map()).set(key, value);
    }
  }

  removeAttribute(key: string): void {
    if (!this._inert && applyMainThreadProp(this, key, null)) return;
    // Unregister an event previously bound through setAttribute's event
    // routing (`:bindtap="cond ? fn : null"` → removeAttribute). No-op if
    // the key never registered; falls through to clear any attr record.
    if (!this._inert) patchEventProp(this, key, null);
    if (key === 'class') {
      if (!this._baseClass) return;
      this._baseClass = '';
      if (!this._inert) {
        pushOp(OP.SET_CLASS, this.uid, resolveClass(this));
        scheduleFlush();
      }
    } else if (key === 'style') {
      if (Object.keys(this._style).length === 0) return;
      this._style = {};
      if (!this._inert) pushStyleOp(this);
    } else if (key === 'id') {
      if (this._id === undefined) return;
      if (this._inert) {
        this._id = undefined;
      } else {
        setIdAttr(this, null);
      }
    } else if (key.startsWith('data-v-')) {
      if (!this._scopeClasses.delete(key)) return;
      if (!this._inert) {
        pushOp(OP.SET_CLASS, this.uid, resolveClass(this));
        scheduleFlush();
      }
    } else {
      if (!this._attrs?.has(key)) return;
      this._attrs.delete(key);
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
      const css = serializeInlineStyle(this._style);
      return css === '' ? null : css;
    }
    return this._attrs?.get(key) ?? null;
  }

  hasAttribute(key: string): boolean {
    if (key.startsWith('data-v-')) return this._scopeClasses.has(key);
    return this.getAttribute(key) != null;
  }

  /** Add a Vue scope token without allowing duplicate class emission. */
  _addScopeClass(scopeClass: string): void {
    if (this._scopeClasses.has(scopeClass)) return;
    this._scopeClasses.add(scopeClass);
    if (!this._inert) {
      pushOp(OP.SET_CLASS, this.uid, resolveClass(this));
      scheduleFlush();
    }
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
      // snapshot only when >1 handler — a lone `.once` handler removing
      // itself mid-call can't disturb an already-finished iteration
      if (binding.handlers.length === 1) {
        binding.handlers[0]!(data);
      } else {
        for (const fn of [...binding.handlers]) fn(data);
      }
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
  /** Release THIS node's addEventListener registrations (non-recursive —
   * subtree recursion lives in tree-ops' releaseSubtree single walk). */
  _releaseOwnEvents(): void {
    if (this._events) {
      for (const binding of this._events.values()) {
        unregister(binding.sign);
      }
      this._events.clear();
    }
  }
}

export const PAGE_ROOT_ID = 1;

/** Create the page root shadow element with the reserved uid=1. */
export function createPageRoot(): ShadowElement {
  return new ShadowElement('page', PAGE_ROOT_ID);
}

// ===========================================================================
// Template fast path (Vapor)
//
// Vapor mounts by cloning a static template prototype once per instance —
// the static structure is identical for every clone. Instead of
// re-serializing the same CREATE/SET/INSERT sequence per instance, the
// structure is sent once (REGISTER_TREE) and each instance is a single
// CLONE_TREE op. The uid contract: the Main Thread assigns element ids
// by pre-order traversal of the structure starting at baseUid; the walk
// below allocates the identical contiguous block, so both sides agree
// without transmitting a mapping. Aliased only-child #text shadow nodes are
// folded into their host (props.t) and take uids after the block — they
// have no Main Thread counterpart.
// ===========================================================================

export type { TemplateNode, TemplateNodeProps } from 'vue-lynx/internal/ops';

/** Non-allocating `Object.keys(o).length > 0` — runs per node per clone. */
function hasAnyKey(o: Record<string, unknown>): boolean {
  for (const _ in o) return true;
  return false;
}

interface TemplateCache {
  id: number;
  structure: TemplateNode;
  count: number;
}

let nextTemplateId = 1;
const registeredTemplateIds = new Set<number>();
const templateCaches = new WeakMap<ShadowElement, TemplateCache>();

function isOnlyChildText(proto: ShadowElement): boolean {
  return (
    proto.nodeType === 1
    && proto.firstChild !== null
    && proto.firstChild.next === null
    && proto.firstChild.tag === '#text'
  );
}

function buildStructure(
  proto: ShadowElement,
  counter: { value: number },
): TemplateNode {
  counter.value++;
  if (proto.tag === '#comment') {
    return ['#comment', 0, []];
  }
  if (proto.tag === '#text') {
    return ['#text', proto._text ? { t: proto._text } : 0, []];
  }

  const props: TemplateNodeProps = {};
  const resolvedClass = resolveClass(proto);
  if (resolvedClass) props.c = resolvedClass;
  if (hasAnyKey(proto._style)) props.s = { ...proto._style };
  if (proto._attrs && proto._attrs.size > 0) props.a = [...proto._attrs];
  if (proto._id !== undefined) props.i = proto._id;

  const fold = isOnlyChildText(proto);
  const children: TemplateNode[] = [];
  if (fold) {
    const text = proto.firstChild!._text;
    // The compiler's dynamic-interpolation placeholder (single space) is
    // overwritten by a renderEffect immediately — omit it.
    if (text != null && text !== ' ') props.t = text;
  } else {
    if (proto._text != null) props.t = proto._text;
    let child = proto.firstChild;
    while (child) {
      children.push(buildStructure(child, counter));
      child = child.next;
    }
  }

  const hasProps = Object.keys(props).length > 0;
  return [proto.tag, hasProps ? props : 0, children];
}

/**
 * Build the shadow clone of `proto`, assigning uids in the same pre-order
 * the Main Thread uses when instantiating the registered structure.
 */
function buildShadowClone(
  proto: ShadowElement,
  base: number,
  counter: { value: number },
): ShadowElement {
  const clone = new ShadowElement(proto.tag, base + counter.value++);

  if (proto.tag === '#text' || proto.tag === '#comment') {
    clone._text = proto._text;
    // The MT instantiation walk consumes the uid either way, but only
    // creates (and inserts) an element for a #text node with content —
    // comments and empty text stay BG-only anchors.
    if (proto.tag === '#text' && proto._text) {
      clone._mtCreated = true;
      clone._mtInserted = true;
    }
    return clone;
  }

  clone._baseClass = proto._baseClass;
  clone._scopeClasses = new Set(proto._scopeClasses);
  if (hasAnyKey(proto._style)) clone._style = { ...proto._style };
  if (proto._attrs) clone._attrs = new Map(proto._attrs);
  if (proto._id !== undefined) {
    clone._id = proto._id;
    // BG-side Teleport target registry (MT applies the id via structure).
    idRegistry.set(proto._id, clone);
  }

  if (isOnlyChildText(proto)) {
    // Aliased only-child text: uid outside the block (no MT counterpart).
    const textClone = new ShadowElement('#text');
    textClone._text = proto.firstChild!._text;
    textClone._textHost = clone;
    clone._aliasedTextChild = textClone;
    clone._link(textClone, null);
  } else {
    clone._text = proto._text;
    let child = proto.firstChild;
    while (child) {
      clone._link(buildShadowClone(child, base, counter), null);
      child = child.next;
    }
  }
  return clone;
}

/**
 * IFR-MT sparse nav facade helpers live below; the full lite clone was
 * replaced by sparse allocation (holes + ancestors + prefix siblings only).
 */

/** Advance `counter` over a proto subtree without allocating clones. */
function skipProtoSlots(
  proto: ShadowElement,
  counter: { value: number },
): void {
  counter.value++;
  if (proto.tag === '#text' || proto.tag === '#comment') return;
  if (isOnlyChildText(proto)) return;
  let child = proto.firstChild;
  while (child) {
    skipProtoSlots(child, counter);
    child = child.next;
  }
}

/**
 * IFR-MT sparse nav facade: allocate ShadowElements only for slots in
 * `needed` (holes + ancestors + prefix siblings). Static subtrees off the
 * vapor `child`/`next` path are skipped entirely — natives still come from
 * CLONE_TREE. Uid reservation stays dense (`nextUid += count`).
 */
function buildShadowCloneSparse(
  proto: ShadowElement,
  base: number,
  counter: { value: number },
  needed: Set<number>,
): ShadowElement | null {
  const slot = counter.value;
  if (!needed.has(slot)) {
    skipProtoSlots(proto, counter);
    return null;
  }

  const clone = new ShadowElement(proto.tag, base + counter.value++);

  if (proto.tag === '#text' || proto.tag === '#comment') {
    clone._text = proto._text;
    if (proto.tag === '#text' && proto._text) {
      clone._mtCreated = true;
      clone._mtInserted = true;
    }
    return clone;
  }

  if (proto._scopeClasses.size > 0) {
    clone._scopeClasses = proto._scopeClasses;
  }
  if (proto._id !== undefined) {
    clone._id = proto._id;
    idRegistry.set(proto._id, clone);
  }

  if (isOnlyChildText(proto)) {
    const textClone = new ShadowElement('#text');
    textClone._text = proto.firstChild!._text;
    textClone._textHost = clone;
    clone._aliasedTextChild = textClone;
    clone._link(textClone, null);
  } else {
    clone._text = proto._text;
    let child = proto.firstChild;
    while (child) {
      const childClone = buildShadowCloneSparse(child, base, counter, needed);
      if (childClone) clone._link(childClone, null);
      child = child.next;
    }
  }
  return clone;
}

function cloneTemplatePrototype(proto: ShadowElement): ShadowElement {
  let cache = templateCaches.get(proto);
  if (!cache) {
    const counter = { value: 0 };
    const structure = buildStructure(proto, counter);
    cache = { id: nextTemplateId++, structure, count: counter.value };
    templateCaches.set(proto, cache);
  }

  if (!registeredTemplateIds.has(cache.id)) {
    registeredTemplateIds.add(cache.id);
    pushOp(OP.REGISTER_TREE, cache.id, cache.structure);
  }

  // Reserve the contiguous uid block for materialized nodes; aliased text
  // shadow nodes allocate after it (plain constructor).
  const base = ShadowElement.nextUid;
  ShadowElement.nextUid += cache.count;

  if (isIfrMainThread() && isVaporIfrElementTemplates()) {
    // Disposable IFR×ET paint: keep the TREE protocol (dense uids for
    // hydration) but shrink BG-side ShadowElement work.
    const holes = inferHoleSlots(cache.structure);
    if (holes.length === 0) {
      // Fully static: vapor never navigates into children — only the root is
      // appended to the page. Children exist solely as natives via CLONE_TREE.
      const root = new ShadowElement(proto.tag, base);
      root._mtCreated = true;
      pushOp(OP.CLONE_TREE, cache.id, base);
      scheduleFlush();
      return root;
    }
    // Hole templates: sparse nav facade — skip ShadowElements for static
    // subtrees off the child/next path to holes.
    const needed = computeIfrNavSlots(cache.structure, holes);
    const counter = { value: 0 };
    const root = buildShadowCloneSparse(proto, base, counter, needed);
    if (!root) {
      // Root is always in `needed`; this is a contract violation.
      throw new Error(
        '[vue-lynx] IFR sparse template clone produced no root',
      );
    }
    if (__DEV__ && counter.value !== cache.count) {
      console.warn(
        `[vue-lynx] IFR sparse template clone advanced ${counter.value} slots but the registered structure has ${cache.count} — uid contract violated.`,
      );
    }
    pushOp(OP.CLONE_TREE, cache.id, base);
    scheduleFlush();
    return root;
  }

  const counter = { value: 0 };
  const root = buildShadowClone(proto, base, counter);
  if (__DEV__ && counter.value !== cache.count) {
    console.warn(
      `[vue-lynx] template clone materialized ${counter.value} nodes but the registered structure has ${cache.count} — uid contract violated.`,
    );
  }

  pushOp(OP.CLONE_TREE, cache.id, base);
  scheduleFlush();
  return root;
}

/** Reset template registration state — for testing only. */
export function resetTemplateState(): void {
  nextTemplateId = 1;
  registeredTemplateIds.clear();
}
