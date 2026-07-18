// Ported from elk: app/composables/content-render.ts — retargeted to Lynx.
//
// Elk's renderer walks the ultrahtml AST (from content-parse.ts) and emits
// DOM vnodes (`h('p')`, `h('a')`, RouterLink, hover-card wrappers). This
// version keeps the exact same walk + mention/hashtag/code special-casing
// but emits Lynx elements instead:
//
//   block HTML (p, blockquote, pre, ul/ol, h1-h5) → <view>/<text> blocks
//   inline HTML (a, b/em/del/code, span)          → nested <text> runs
//   custom emoji <img>                            → inline <image>
//   <a class=mention>/hashtag                     → tappable <text> → router
//
// Hover cards (AccountHoverWrapper/TagHoverWrapper) are replaced by tap
// navigation — hover has no equivalent on touch devices.
import type { mastodon } from 'masto';
import type { Node } from 'ultrahtml';
import type { VNode, VNodeChild } from 'vue-lynx';
import type { Router } from 'vue-router';
import { decode } from './html-entities';
import { ELEMENT_NODE, TEXT_NODE } from 'ultrahtml';
import { h } from 'vue-lynx';
import {
  type ContentParseOptions,
  parseMastodonHTML,
  recursiveTreeToText,
  TagLinkRE,
  UserLinkRE,
} from './content-parse';
import { currentServer } from './users';

export interface RenderContext {
  router?: Router;
  /** font size in px for body text (Elk: --font-size). */
  fontSize?: number;
}

const SERVER_DOMAIN_REGEX = /(.+\.)(.+\..+)/;
const WHITESPACE_SPLIT_REGEX = /\s/g;

const BLOCK_TAGS = new Set(['p', 'pre', 'blockquote', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'mention-group']);

/**
 * Raw Mastodon HTML → array of Lynx block VNodes.
 * (Elk's contentToVNode returns a Fragment; a plain array plays nicer with
 * Lynx <view> children.)
 */
export function contentToVNode(
  content: string,
  options?: ContentParseOptions,
  ctx: RenderContext = {},
): VNode[] {
  const tree = parseMastodonHTML(content, options);
  return renderBlocks((tree.children ?? []) as Node[], ctx);
}

/** Group root-level children into blocks; loose inline nodes get wrapped into an implicit paragraph. */
function renderBlocks(nodes: Node[], ctx: RenderContext): VNode[] {
  const blocks: VNode[] = [];
  let inlineRun: Node[] = [];

  const flushInline = () => {
    if (!inlineRun.length)
      return;
    const children = inlineRun.flatMap(n => renderInline(n, ctx));
    if (children.length)
      blocks.push(h('text', { class: 'content-p' }, children));
    inlineRun = [];
  };

  for (const node of nodes) {
    if (node.type === ELEMENT_NODE && BLOCK_TAGS.has(node.name)) {
      flushInline();
      const block = renderBlock(node, ctx);
      if (block)
        blocks.push(block);
    }
    else if (node.type === TEXT_NODE && !node.value.trim()) {
      // whitespace between blocks
    }
    else {
      inlineRun.push(node);
    }
  }
  flushInline();
  return blocks;
}

function renderBlock(node: Node, ctx: RenderContext): VNode | null {
  switch (node.name) {
    case 'p': {
      const children = (node.children as Node[]).flatMap(n => renderInline(n, ctx));
      // Elk injects empty <p> spacers between paragraphs (transformParagraphs)
      if (!children.length)
        return h('view', { class: 'content-p-gap' });
      return h('text', { class: 'content-p' }, children);
    }
    case 'pre':
      return renderCodeBlock(node);
    case 'blockquote':
      return h('view', { class: 'content-blockquote' }, renderBlocks(node.children as Node[], ctx));
    case 'ul':
    case 'ol':
      return h('view', { class: 'content-list' }, (node.children as Node[])
        .filter(c => c.type === ELEMENT_NODE && c.name === 'li')
        .map((li, i) => h('view', { class: 'content-li' }, [
          h('text', { class: 'content-li-marker' }, node.name === 'ol' ? `${i + 1}.` : '•'),
          h('text', { class: 'content-p content-li-body' }, (li.children as Node[]).flatMap(n => renderInline(n, ctx))),
        ])));
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5': {
      const children = (node.children as Node[]).flatMap(n => renderInline(n, ctx));
      return h('text', { class: `content-heading content-${node.name}` }, children);
    }
    case 'mention-group':
      return h('view', { class: 'content-mention-group' }, [
        h('text', { class: 'content-p' }, (node.children as Node[]).flatMap(n => renderInline(n, ctx))),
      ]);
    default:
      return null;
  }
}

// Elk renders <pre><code> through ContentCode.vue with Shiki highlighting;
// Shiki is unsuitable for the Lynx runtime, so this is a plain mono block.
function renderCodeBlock(node: Node): VNode {
  const codeEl = (node.children as Node[])[0];
  const code = codeEl?.name === 'code' ? recursiveTreeToText(codeEl) : recursiveTreeToText(node);
  return h('view', { class: 'content-pre' }, [
    h('text', { class: 'content-pre-text' }, code.trim()),
  ]);
}

function renderInline(node: Node, ctx: RenderContext, inheritedClass = ''): VNodeChild[] {
  if (!node)
    return [];

  if (node.type === TEXT_NODE)
    return [inheritedClass ? h('text', { class: inheritedClass }, decode(node.value)) : decode(node.value)];

  if (node.type !== ELEMENT_NODE)
    return [];

  const children = (node.children ?? []) as Node[];
  const renderChildren = (cls: string) => children.flatMap(c => renderInline(c, ctx, cls));

  switch (node.name) {
    case 'br':
      return ['\n'];
    case 'a':
      return [renderLink(node, ctx)];
    case 'b':
    case 'strong':
      return renderChildren(`${inheritedClass} content-bold`.trim());
    case 'i':
    case 'em':
      return renderChildren(`${inheritedClass} content-italic`.trim());
    case 'del':
      return renderChildren(`${inheritedClass} content-del`.trim());
    case 'u':
      return renderChildren(`${inheritedClass} content-underline`.trim());
    case 'code':
      return [h('text', { class: 'content-code-inline' }, recursiveTreeToText(node))];
    case 'sub':
    case 'sup':
      return renderChildren(`${inheritedClass} content-small`.trim());
    case 'abbr':
    case 'ruby':
      return renderChildren(inheritedClass);
    case 'rp':
    case 'rt':
      return []; // ruby annotations dropped (no ruby layout in Lynx)
    case 'img': {
      // custom emoji (content-parse replaceCustomEmoji emits these)
      if (node.attributes?.class?.includes('custom-emoji')) {
        return [h('image', {
          class: 'content-emoji',
          src: node.attributes.src,
        })];
      }
      return [];
    }
    case 'span': {
      const cls = node.attributes?.class ?? '';
      // Mastodon wraps the hidden protocol/tail of long URLs in
      // span.invisible; Elk hides them with CSS `display: none`.
      if (cls.includes('invisible'))
        return [];
      if (cls.includes('ellipsis')) {
        const runs = renderChildren(inheritedClass);
        runs.push('…');
        return runs;
      }
      return renderChildren(inheritedClass);
    }
    default:
      return renderChildren(inheritedClass);
  }
}

// Port of Elk's handleMention + link rendering (content-render.ts).
function renderLink(node: Node, ctx: RenderContext): VNode {
  const href = node.attributes?.href;
  const cls = node.attributes?.class ?? '';
  const children = (node.children ?? []) as Node[];

  let onTap: (() => void) | undefined;
  let linkClass = 'content-link';

  if (href && cls.includes('mention')) {
    const matchUser = href.match(UserLinkRE);
    if (matchUser) {
      const [, server, username] = matchUser;
      const handle = `${username}@${server.replace(SERVER_DOMAIN_REGEX, '$2')}`;
      linkClass = 'content-mention';
      onTap = () => ctx.router?.push(`/${currentServer.value}/@${handle}`);
    }
  }
  if (!onTap && href) {
    const matchTag = href.match(TagLinkRE);
    if (matchTag || cls.includes('hashtag')) {
      const tagName = matchTag
        ? matchTag[2]
        : textOf(node).replace(/^#/, '');
      linkClass = 'content-mention';
      onTap = () => ctx.router?.push(`/${currentServer.value}/tags/${tagName}`);
    }
  }
  if (!onTap && href?.startsWith('/')) {
    // relative link (already rewritten by a transform)
    onTap = () => ctx.router?.push(href);
  }
  if (!onTap) {
    // external link: no browser to open on Lynx; native hosts wire this to
    // an openSchema NativeModule. Kept as styled, inert text here.
    onTap = () => {};
  }

  return h(
    'text',
    { class: linkClass, onTap },
    children.flatMap(c => renderInline(c, ctx)),
  );
}

function textOf(node: Node): string {
  if (node.type === TEXT_NODE)
    return node.value;
  return ((node.children ?? []) as Node[]).map(textOf).join('');
}

/** Convenience for account display names etc — rich text on a single line. */
export function nameToVNode(
  account: mastodon.v1.Account,
  ctx: RenderContext = {},
): VNodeChild[] {
  const name = account.displayName || account.username;
  const emojis = Object.fromEntries((account.emojis ?? []).map(e => [e.shortcode, e]));
  const tree = parseMastodonHTML(name, { emojis, markdown: false });
  return ((tree.children ?? []) as Node[]).flatMap(n => renderInline(n, ctx));
}
