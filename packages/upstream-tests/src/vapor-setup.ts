import { beforeEach } from 'vitest';
import { resetForTesting, ShadowElement } from 'vue-lynx';
import 'vue-lynx/vapor';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function serialize(node: ShadowElement): string {
  if (node.nodeType === 3) return escapeHtml(node.textContent);
  if (node.nodeType === 8) return `<!--${node.textContent}-->`;
  if (node.nodeType === 11) return node.childNodes.map(serialize).join('');

  const attrs: string[] = [];
  const anyNode = node as ShadowElement & {
    _attrs?: Map<string, string>;
    _baseClass?: string;
    _style?: Record<string, unknown>;
    id?: string;
  };
  if (anyNode.id) attrs.push(`id="${escapeAttr(anyNode.id)}"`);
  if (anyNode._baseClass) attrs.push(`class="${escapeAttr(anyNode._baseClass)}"`);
  const style = anyNode.getAttribute?.('style');
  if (style) attrs.push(`style="${escapeAttr(style)}"`);
  if (anyNode._attrs) {
    for (const [key, value] of anyNode._attrs) {
      if (key === 'id' || key === 'class' || key === 'style') continue;
      attrs.push(value === '' ? key : `${key}="${escapeAttr(value)}"`);
    }
  }
  const open = attrs.length > 0 ? `<${node.localName} ${attrs.join(' ')}>` : `<${node.localName}>`;
  return `${open}${node.childNodes.map(serialize).join('') || escapeHtml(node.textContent)}${`</${node.localName}>`}`;
}

if (!Object.getOwnPropertyDescriptor(ShadowElement.prototype, 'innerHTML')) {
  Object.defineProperty(ShadowElement.prototype, 'innerHTML', {
    configurable: true,
    get(this: ShadowElement) {
      return this.childNodes.map(serialize).join('') || escapeHtml(this.textContent);
    },
    set(this: ShadowElement, value: string) {
      this.textContent = value;
    },
  });
}

const doc = globalThis.document as unknown as Record<string, unknown>;
if (doc && !doc.body) {
  const body = new ShadowElement('body');
  doc.body = body;
}

beforeEach(() => {
  resetForTesting();
});
