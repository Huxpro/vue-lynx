// This source entry must be the first import: it installs the Lynx Vapor DOM
// shim before upstream runtime-vapor or compiler helpers are evaluated.
import '../../vue-lynx/runtime/src/vapor-app.js';
import './local-test-setup.js';

import { resetForTesting } from '../../vue-lynx/runtime/src/index.js';
import {
  createPageRoot,
  ShadowElement,
} from '../../vue-lynx/runtime/src/shadow-element.js';
import { cleanupVaporAppsForTesting } from './lynx-runtime-vapor-bridge.js';

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);
const attributeOrder = new WeakMap<ShadowElement, string[]>();

function escapeText(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeText(value).replaceAll('"', '&quot;');
}

function hyphenateStyleName(name: string): string {
  return name.startsWith('--')
    ? name
    : name.replace(/\B([A-Z])/g, '-$1').toLowerCase();
}

function serializeStyle(node: ShadowElement): string {
  return Object.entries(node._style)
    .map(([key, value]) => `${hyphenateStyleName(key)}: ${String(value)};`)
    .join(' ');
}

function serializeChildren(node: ShadowElement): string {
  let html = '';
  let child = node.firstChild;
  while (child) {
    html += serializeNode(child);
    child = child.next;
  }
  return html === '' && node._text != null ? escapeText(node._text) : html;
}

function serializeNode(node: ShadowElement): string {
  if (node.nodeType === 3) return escapeText(node.data);
  if (node.nodeType === 8) return `<!--${node.data}-->`;
  if (node.nodeType === 11) return serializeChildren(node);

  const attributes = new Map<string, string>();
  const className = [node._baseClass, ...node._scopeClasses]
    .filter(Boolean)
    .join(' ');
  if (className || attributeOrder.get(node)?.includes('class')) {
    attributes.set('class', escapeAttribute(className));
  }

  const style = serializeStyle(node);
  if (style || attributeOrder.get(node)?.includes('style')) {
    attributes.set('style', escapeAttribute(style));
  }

  if (node._attrs) {
    for (const [key, value] of node._attrs) {
      attributes.set(key, escapeAttribute(value));
    }
  }
  if (node._id !== undefined) {
    attributes.set('id', escapeAttribute(node._id));
  }

  const orderedAttributes: string[] = [];
  for (const key of attributeOrder.get(node) ?? []) {
    const value = attributes.get(key);
    if (value === undefined) continue;
    orderedAttributes.push(`${key}="${value}"`);
    attributes.delete(key);
  }
  for (const [key, value] of attributes) {
    orderedAttributes.push(`${key}="${value}"`);
  }

  const open = `<${node.tag}${
    orderedAttributes.length > 0 ? ` ${orderedAttributes.join(' ')}` : ''
  }>`;
  return VOID_ELEMENTS.has(node.tag)
    ? open
    : `${open}${serializeChildren(node)}</${node.tag}>`;
}

const FACADE_STATE = Symbol.for('vue-lynx.vapor-upstream-facade');

interface FacadeState {
  append: PropertyDescriptor | undefined;
  attributes: PropertyDescriptor | undefined;
  className: PropertyDescriptor;
  children: PropertyDescriptor | undefined;
  classList: PropertyDescriptor | undefined;
  click: PropertyDescriptor | undefined;
  cloneNode: PropertyDescriptor;
  dispatchEvent: PropertyDescriptor | undefined;
  firstElementChild: PropertyDescriptor | undefined;
  getAttribute: PropertyDescriptor;
  id: PropertyDescriptor | undefined;
  innerHTML: PropertyDescriptor | undefined;
  querySelector: PropertyDescriptor | undefined;
  querySelectorAll: PropertyDescriptor | undefined;
  references: number;
  removeAttribute: PropertyDescriptor;
  setAttribute: PropertyDescriptor;
  style: PropertyDescriptor;
  textContent: PropertyDescriptor;
}

function elementChildren(node: ShadowElement): ShadowElement[] {
  return node.childNodes.filter((child) => child.nodeType === 1);
}

function matchesSelector(node: ShadowElement, selector: string): boolean {
  if (selector.startsWith('.')) {
    return node.classList.contains(selector.slice(1));
  }
  if (selector.startsWith('#')) return node._id === selector.slice(1);
  return node.localName === selector.toLowerCase();
}

function selectAll(node: ShadowElement, selector: string): ShadowElement[] {
  const matches: ShadowElement[] = [];
  const visit = (parent: ShadowElement): void => {
    for (const child of parent.childNodes) {
      if (child.nodeType !== 1) continue;
      if (matchesSelector(child, selector)) matches.push(child);
      visit(child);
    }
  };
  visit(node);
  return matches;
}

function installShadowElementFacade(): () => void {
  const globals = globalThis as Record<PropertyKey, unknown>;
  let state = globals[FACADE_STATE] as FacadeState | undefined;
  if (!state) {
    const originalTextContent = Object.getOwnPropertyDescriptor(
      ShadowElement.prototype,
      'textContent',
    );
    if (!originalTextContent?.get || !originalTextContent.set) {
      throw new Error(
        '[vue-lynx test facade] ShadowElement.textContent is not configurable',
      );
    }
    const originalClassName = Object.getOwnPropertyDescriptor(
      ShadowElement.prototype,
      'className',
    );
    const originalCloneNode = Object.getOwnPropertyDescriptor(
      ShadowElement.prototype,
      'cloneNode',
    );
    const originalGetAttribute = Object.getOwnPropertyDescriptor(
      ShadowElement.prototype,
      'getAttribute',
    );
    const originalRemoveAttribute = Object.getOwnPropertyDescriptor(
      ShadowElement.prototype,
      'removeAttribute',
    );
    const originalSetAttribute = Object.getOwnPropertyDescriptor(
      ShadowElement.prototype,
      'setAttribute',
    );
    const originalStyle = Object.getOwnPropertyDescriptor(
      ShadowElement.prototype,
      'style',
    );
    if (
      !originalClassName?.get
      || !originalClassName.set
      || !originalCloneNode?.value
      || !originalGetAttribute?.value
      || !originalRemoveAttribute?.value
      || !originalSetAttribute?.value
      || !originalStyle?.get
    ) {
      throw new Error(
        '[vue-lynx test facade] required ShadowElement DOM descriptors are missing',
      );
    }

    state = {
      append: Object.getOwnPropertyDescriptor(ShadowElement.prototype, 'append'),
      attributes: Object.getOwnPropertyDescriptor(
        ShadowElement.prototype,
        'attributes',
      ),
      className: originalClassName,
      children: Object.getOwnPropertyDescriptor(
        ShadowElement.prototype,
        'children',
      ),
      classList: Object.getOwnPropertyDescriptor(
        ShadowElement.prototype,
        'classList',
      ),
      click: Object.getOwnPropertyDescriptor(ShadowElement.prototype, 'click'),
      cloneNode: originalCloneNode,
      dispatchEvent: Object.getOwnPropertyDescriptor(
        ShadowElement.prototype,
        'dispatchEvent',
      ),
      firstElementChild: Object.getOwnPropertyDescriptor(
        ShadowElement.prototype,
        'firstElementChild',
      ),
      getAttribute: originalGetAttribute,
      id: Object.getOwnPropertyDescriptor(ShadowElement.prototype, 'id'),
      innerHTML: Object.getOwnPropertyDescriptor(
        ShadowElement.prototype,
        'innerHTML',
      ),
      querySelector: Object.getOwnPropertyDescriptor(
        ShadowElement.prototype,
        'querySelector',
      ),
      querySelectorAll: Object.getOwnPropertyDescriptor(
        ShadowElement.prototype,
        'querySelectorAll',
      ),
      references: 0,
      removeAttribute: originalRemoveAttribute,
      setAttribute: originalSetAttribute,
      style: originalStyle,
      textContent: originalTextContent,
    };
    globals[FACADE_STATE] = state;

    Object.defineProperties(ShadowElement.prototype, {
      append: {
        configurable: true,
        value(this: ShadowElement, ...nodes: Array<ShadowElement | string>) {
          for (const node of nodes) {
            this.appendChild(
              typeof node === 'string'
                ? (document.createTextNode(node) as unknown as ShadowElement)
                : node,
            );
          }
        },
      },
      attributes: {
        configurable: true,
        get(this: ShadowElement) {
          const names = new Set<string>();
          if (this._baseClass || attributeOrder.get(this)?.includes('class')) {
            names.add('class');
          }
          if (
            serializeStyle(this)
            || attributeOrder.get(this)?.includes('style')
          ) {
            names.add('style');
          }
          for (const key of this._attrs?.keys() ?? []) names.add(key);
          if (this._id !== undefined) names.add('id');

          return [...names].map((name) => ({
            name,
            value: this.getAttribute(name) ?? '',
          }));
        },
      },
      className: {
        configurable: true,
        get(this: ShadowElement) {
          return state!.className.get!.call(this);
        },
        set(this: ShadowElement, value: string) {
          state!.className.set!.call(this, value);
          const order = attributeOrder.get(this) ?? [];
          if (!order.includes('class')) order.push('class');
          attributeOrder.set(this, order);
        },
      },
      children: {
        configurable: true,
        get(this: ShadowElement) {
          return elementChildren(this);
        },
      },
      classList: {
        configurable: true,
        get(this: ShadowElement) {
          const list = state!.classList!.get!.call(this) as object;
          if (!Object.getOwnPropertyDescriptor(list, 'length')) {
            Object.defineProperty(list, 'length', {
              configurable: true,
              get: () => this._baseClass.split(/\s+/).filter(Boolean).length,
            });
          }
          return list;
        },
      },
      click: {
        configurable: true,
        value(this: ShadowElement) {
          return (this as ShadowElement & { dispatchEvent(event: Event): boolean })
            .dispatchEvent(new Event('click'));
        },
      },
      cloneNode: {
        configurable: true,
        value(this: ShadowElement, deep?: boolean) {
          const clone = state!.cloneNode.value!.call(this, deep) as ShadowElement;
          const sourceOrder = attributeOrder.get(this) ?? [
            ...(this._baseClass ? ['class'] : []),
            ...(Object.keys(this._style).length > 0 ? ['style'] : []),
            ...[...(this._attrs?.keys() ?? [])],
            ...(this._id !== undefined ? ['id'] : []),
          ];
          if (sourceOrder.length > 0) {
            attributeOrder.set(clone, [...sourceOrder]);
          }
          return clone;
        },
      },
      dispatchEvent: {
        configurable: true,
        value(this: ShadowElement, event: Event) {
          const binding = this._events?.get(event.type);
          if (!binding) return true;
          for (const handler of [...binding.handlers]) handler(event);
          return !event.defaultPrevented;
        },
      },
      firstElementChild: {
        configurable: true,
        get(this: ShadowElement) {
          return elementChildren(this)[0] ?? null;
        },
      },
      getAttribute: {
        configurable: true,
        value(this: ShadowElement, key: string) {
          if (key === 'class' && attributeOrder.get(this)?.includes('class')) {
            return this._baseClass;
          }
          if (key === 'style') {
            const style = serializeStyle(this);
            return style === '' && !attributeOrder.get(this)?.includes('style')
              ? null
              : style;
          }
          return state!.getAttribute.value!.call(this, key);
        },
      },
      id: {
        configurable: true,
        get(this: ShadowElement) {
          return this._id ?? '';
        },
        set(this: ShadowElement, value: unknown) {
          this.setAttribute('id', value == null ? '' : String(value));
        },
      },
      innerHTML: {
        configurable: true,
        get(this: ShadowElement) {
          return serializeChildren(this);
        },
        set(this: ShadowElement, value: string) {
          // Several upstream renderer tests use innerHTML as a terse way to
          // assign plain fixture text. Supporting text-only values does not
          // simulate v-html: markup remains rejected and vue-lynx's exported
          // setHtml helper remains its intentional warning/no-op override.
          const text = String(value);
          if (/[<>]/.test(text)) {
            throw new Error(
              '[vue-lynx test facade] markup innerHTML is unsupported',
            );
          }
          this.textContent = text;
        },
      },
      querySelector: {
        configurable: true,
        value(this: ShadowElement, selector: string) {
          return selectAll(this, selector)[0] ?? null;
        },
      },
      querySelectorAll: {
        configurable: true,
        value(this: ShadowElement, selector: string) {
          return selectAll(this, selector);
        },
      },
      removeAttribute: {
        configurable: true,
        value(this: ShadowElement, key: string) {
          const result = state!.removeAttribute.value!.call(this, key);
          const order = attributeOrder.get(this);
          const index = order?.indexOf(key) ?? -1;
          if (index >= 0) order!.splice(index, 1);
          return result;
        },
      },
      setAttribute: {
        configurable: true,
        value(this: ShadowElement, key: string, value: unknown) {
          const result = state!.setAttribute.value!.call(this, key, value);
          if (!key.startsWith('data-v-') && this.getAttribute(key) !== null) {
            const order = attributeOrder.get(this) ?? [];
            if (!order.includes(key)) order.push(key);
            attributeOrder.set(this, order);
          }
          return result;
        },
      },
      style: {
        configurable: true,
        get(this: ShadowElement) {
          const element = this;
          const facade = state!.style.get!.call(this) as Record<string, unknown>;
          return new Proxy(facade, {
            get(target, key, receiver) {
              if (key === 'cssText') {
                return serializeStyle(element)
                  .replaceAll(': ', ':')
                  .replaceAll('; ', ';');
              }
              const value = Reflect.get(target, key, receiver);
              return typeof key === 'string' && value === undefined ? '' : value;
            },
            set(target, key, value, receiver) {
              const order = attributeOrder.get(element) ?? [];
              if (
                value !== ''
                || order.includes('style')
                || Object.keys(element._style).length > 0
              ) {
                if (!order.includes('style')) order.push('style');
                attributeOrder.set(element, order);
              }
              return Reflect.set(target, key, value, receiver);
            },
          });
        },
      },
      textContent: {
        configurable: true,
        get(this: ShadowElement) {
          if (this.nodeType !== 1 && this.nodeType !== 11) {
            return this._text ?? '';
          }
          let value = '';
          let child = this.firstChild;
          while (child) {
            if (child.nodeType !== 8) value += child.textContent;
            child = child.next;
          }
          return value === '' && this._text != null ? this._text : value;
        },
        set(this: ShadowElement, value: unknown) {
          originalTextContent.set!.call(
            this,
            value == null ? '' : String(value),
          );
        },
      },
    });
  }

  state.references++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    state!.references--;
    if (state!.references !== 0) return;

    for (const key of [
      'append',
      'attributes',
      'className',
      'children',
      'classList',
      'click',
      'cloneNode',
      'dispatchEvent',
      'firstElementChild',
      'getAttribute',
      'id',
      'innerHTML',
      'querySelector',
      'querySelectorAll',
      'removeAttribute',
      'setAttribute',
      'style',
    ] as const) {
      const descriptor = state![key];
      if (descriptor) {
        Object.defineProperty(ShadowElement.prototype, key, descriptor);
      } else {
        delete (ShadowElement.prototype as unknown as Record<string, unknown>)[
          key
        ];
      }
    }
    Object.defineProperty(
      ShadowElement.prototype,
      'textContent',
      state!.textContent,
    );
    delete globals[FACADE_STATE];
  };
}

const releaseFacade = installShadowElementFacade();
const lynxDocument = document as unknown as {
  body?: ShadowElement;
};
let currentBody: ShadowElement | undefined;

function installFreshBody(): void {
  // resetForTesting() restores nextUid=2. The document root itself must use
  // uid=1 without consuming uid=2, which belongs to the first test element.
  currentBody = createPageRoot();
  lynxDocument.body = currentBody;
}

cleanupVaporAppsForTesting();
resetForTesting();
installFreshBody();

beforeEach(() => {
  cleanupVaporAppsForTesting();
  resetForTesting();
  installFreshBody();
});

afterEach(() => {
  // Do not clear/reset the body here. Upstream _utils may run host.remove()
  // before or after this hook; both orders are safe while the old tree stays
  // intact until the next test's beforeEach reset.
  cleanupVaporAppsForTesting();
});

afterAll(() => {
  cleanupVaporAppsForTesting();
  if (lynxDocument.body === currentBody) delete lynxDocument.body;
  currentBody = undefined;
  releaseFacade();
});
