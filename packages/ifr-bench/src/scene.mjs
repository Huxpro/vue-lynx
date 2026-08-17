/**
 * Scene DSL and per-variant code generators.
 *
 * One scene descriptor produces every variant's input so all variants render
 * the same logical tree:
 *   - a Vue template string (compiled with @vue/compiler-dom, same options as
 *     the vue-lynx plugin) — for the vdom-based variants
 *   - a rewritten template where fully-static islands become `<sta-N>` tags
 *     (route a: static element templates)
 *   - a rewritten template where whole blocks become `<tpl-N>` tags with
 *     hole props (route b/Q2: block templates with holes + slots)
 *   - generated straight-line PAPI functions (skeleton create(), floor,
 *     vapor-style render) via `new Function` — the compile-time-lowered form
 *
 * DSL node shapes:
 *   element:  { tag, sprops?, dprops?, on?, children? }
 *     sprops: static props        { class: 'card', src: 'x.png' }
 *     dprops: dynamic props       { class: 'cardCls' }        (data key)
 *     on:     event handlers      { tap: 'onTap' }            (data key)
 *     children: nodes | text parts
 *   text part: 'static string' | { bind: 'dataKey' } | { item: 'field' }
 *   list:     { each: 'itemsKey', keyField: 'id', body: element }
 *     (body text/dprops may use { item: 'field' } / dpropsItem: { class: 'field' })
 */

// ---------------------------------------------------------------------------
// DSL helpers
// ---------------------------------------------------------------------------

export function el(tag, opts = {}, children = []) {
  return { tag, ...opts, children };
}

export function list(each, keyField, body) {
  return { each, keyField, body };
}

const isTextPart = (n) => typeof n === 'string' || n.bind !== undefined || n.item !== undefined;

// ---------------------------------------------------------------------------
// Vue template generation
// ---------------------------------------------------------------------------

function attrString(node, extra = '') {
  let s = extra;
  for (const [k, v] of Object.entries(node.sprops ?? {})) s += ` ${k}="${v}"`;
  for (const [k, v] of Object.entries(node.dprops ?? {})) s += ` :${k}="${v}"`;
  for (const [k, v] of Object.entries(node.dpropsItem ?? {})) s += ` :${k}="item.${v}"`;
  for (const [k, v] of Object.entries(node.on ?? {})) s += ` @${k}="${v}"`;
  return s;
}

function textPartToTemplate(p) {
  if (typeof p === 'string') return p;
  if (p.bind !== undefined) return `{{ ${p.bind} }}`;
  return `{{ item.${p.item} }}`;
}

export function toTemplate(node, transform = null) {
  if (node.each) {
    const body = { ...node.body };
    const vfor = ` v-for="item in ${node.each}" :key="item.${node.keyField}"`;
    return elementToTemplate(body, transform, vfor);
  }
  return elementToTemplate(node, transform, '');
}

function elementToTemplate(node, transform, extra) {
  if (transform) {
    const replaced = transform(node, extra);
    if (replaced !== null) return replaced;
  }
  const kids = (node.children ?? [])
    .map((c) => (isTextPart(c) ? textPartToTemplate(c) : toTemplate(c, transform)))
    .join('');
  return `<${node.tag}${attrString(node, extra)}>${kids}</${node.tag}>`;
}

// ---------------------------------------------------------------------------
// Static analysis on the DSL
// ---------------------------------------------------------------------------

export function isStaticNode(node) {
  if (node.each) return false;
  if (node.dprops && Object.keys(node.dprops).length) return false;
  if (node.dpropsItem && Object.keys(node.dpropsItem).length) return false;
  if (node.on && Object.keys(node.on).length) return false;
  for (const c of node.children ?? []) {
    if (isTextPart(c)) {
      if (typeof c !== 'string') return false;
    } else if (!isStaticNode(c)) return false;
  }
  return true;
}

/** Count element nodes (per rendered instance; lists count body × 1). */
export function countNodes(node) {
  if (node.each) return countNodes(node.body);
  let n = 1;
  const kids = node.children ?? [];
  const singleText = kids.length === 1 && isTextPart(kids[0]);
  for (const c of kids) {
    if (!isTextPart(c)) n += countNodes(c);
    else if (!singleText) n += 1; // mixed text parts become __CreateText children
  }
  return n;
}

/** Static coverage: fraction of element nodes inside maximal static subtrees. */
export function staticCoverage(node) {
  let total = 0;
  let covered = 0;
  const walk = (n, insideStatic) => {
    if (n.each) {
      walk(n.body, false);
      return;
    }
    const nowStatic = insideStatic || isStaticNode(n);
    total += 1;
    if (nowStatic) covered += 1;
    for (const c of n.children ?? []) {
      if (!isTextPart(c)) walk(c, nowStatic);
    }
  };
  walk(node, false);
  return { total, covered, ratio: covered / total };
}

// ---------------------------------------------------------------------------
// Straight-line PAPI codegen
// ---------------------------------------------------------------------------
//
// Generates the source of a `create()` function à la ReactLynx snapshots:
// one local per element, direct __Create*/__SetAttribute/__AppendElement
// calls. Dynamic parts either become holes (collected handles returned for
// later setting) or inline reads from `data` / the loop item `it`.

const TYPED_CREATE = {
  view: '__CreateView',
  text: '__CreateText',
  image: '__CreateImage',
  'scroll-view': '__CreateScrollView',
};

function createCall(tag) {
  const fn = TYPED_CREATE[tag];
  return fn ? `${fn}(P)` : `__CreateElement(${JSON.stringify(tag)}, P)`;
}

/**
 * @param node element DSL node
 * @param mode 'holes'  — dynamic parts recorded into H (returned), lists into S
 *             'inline' — dynamic parts read from `data`; lists loop inline
 *             'item'   — like inline but item-scoped reads come from `it`
 * @returns { src, holes, slots } holes: [{kind:'prop'|'text'|'event', prop?, key?, item?}]
 */
export function genCreate(node, mode) {
  let id = 0;
  const lines = [];
  const holes = [];
  const slots = [];

  const emit = (n, parentVar) => {
    if (n.each) {
      if (mode === 'holes') {
        // Slot: record the container; items are mounted separately.
        slots.push({ each: n.each, keyField: n.keyField, parentVar });
        lines.push(`S.push(${parentVar});`);
        return;
      }
      // inline: loop over data items, generating the item subtree inline.
      const itemSrc = genCreate(n.body, 'item');
      lines.push(
        `for (let _i = 0; _i < data.${n.each}.length; _i++) {`,
        `  const it = data.${n.each}[_i];`,
        `  const _r = (${itemSrc.fnSrc})(it, P, EV);`,
        `  __AppendElement(${parentVar}, _r);`,
        `}`,
      );
      return;
    }

    const v = `e${id++}`;
    lines.push(`const ${v} = ${createCall(n.tag)};`);
    lines.push(`__SetCSSId([${v}], 0);`);
    for (const [k, val] of Object.entries(n.sprops ?? {})) {
      if (k === 'class') lines.push(`__SetClasses(${v}, ${JSON.stringify(val)});`);
      else if (k === 'style') lines.push(`__SetInlineStyles(${v}, ${JSON.stringify(val)});`);
      else lines.push(`__SetAttribute(${v}, ${JSON.stringify(k)}, ${JSON.stringify(val)});`);
    }
    for (const [k, key] of Object.entries(n.dprops ?? {})) {
      if (mode === 'holes') {
        holes.push({ kind: 'prop', prop: k, key });
        lines.push(`H.push(${v});`);
      } else {
        const read = `data.${key}`;
        if (k === 'class') lines.push(`__SetClasses(${v}, ${read});`);
        else if (k === 'style') lines.push(`__SetInlineStyles(${v}, ${read});`);
        else lines.push(`__SetAttribute(${v}, ${JSON.stringify(k)}, ${read});`);
      }
    }
    for (const [k, field] of Object.entries(n.dpropsItem ?? {})) {
      if (mode === 'holes') {
        holes.push({ kind: 'prop', prop: k, item: field });
        lines.push(`H.push(${v});`);
      } else {
        const read = `it.${field}`;
        if (k === 'class') lines.push(`__SetClasses(${v}, ${read});`);
        else lines.push(`__SetAttribute(${v}, ${JSON.stringify(k)}, ${read});`);
      }
    }
    for (const [evt, key] of Object.entries(n.on ?? {})) {
      if (mode === 'holes') {
        holes.push({ kind: 'event', event: evt, key });
        lines.push(`H.push(${v});`);
      } else {
        lines.push(`__AddEvent(${v}, 'bindEvent', ${JSON.stringify(evt)}, EV(${JSON.stringify(key)}));`);
      }
    }

    // children. A single text-part child mirrors the real pipeline's
    // setElementText fast path: the value is set as the 'text' attribute on
    // the element itself (no child node). Mixed children materialize text
    // parts as __CreateText children (the CREATE_TEXT op path).
    const kids = n.children ?? [];
    const singleText = kids.length === 1 && isTextPart(kids[0]);
    if (singleText) {
      const c = kids[0];
      if (typeof c === 'string') {
        lines.push(`__SetAttribute(${v}, 'text', ${JSON.stringify(c)});`);
      } else if (mode === 'holes') {
        holes.push({ kind: 'text', key: c.bind, item: c.item });
        lines.push(`H.push(${v});`);
      } else {
        const read = c.bind !== undefined ? `data.${c.bind}` : `it.${c.item}`;
        lines.push(`__SetAttribute(${v}, 'text', ${read});`);
      }
    } else {
      for (const c of kids) {
        if (isTextPart(c)) {
          const tv = `e${id++}`;
          lines.push(`const ${tv} = __CreateText(P);`);
          lines.push(`__SetCSSId([${tv}], 0);`);
          if (typeof c === 'string') {
            lines.push(`__SetAttribute(${tv}, 'text', ${JSON.stringify(c)});`);
          } else if (mode === 'holes') {
            holes.push({ kind: 'text', key: c.bind, item: c.item });
            lines.push(`H.push(${tv});`);
          } else {
            const read = c.bind !== undefined ? `data.${c.bind}` : `it.${c.item}`;
            lines.push(`__SetAttribute(${tv}, 'text', ${read});`);
          }
          lines.push(`__AppendElement(${v}, ${tv});`);
        } else {
          const childVar = emit(c, v);
          if (childVar) lines.push(`__AppendElement(${v}, ${childVar});`);
        }
      }
    }
    return v;
  };

  const rootVar = emit(node, null);
  const body = lines.join('\n');
  const fnSrc = mode === 'item'
    ? `function (it, P, EV) {\n${body}\nreturn ${rootVar};\n}`
    : mode === 'inline'
    ? `function (data, P, EV) {\n${body}\nreturn ${rootVar};\n}`
    : `function (P, H, S) {\n${body}\nreturn ${rootVar};\n}`;

  return { fnSrc, holes, slots, rootVar };
}

/** Compile a straight-line function from generated source. */
export function compileFn(src) {
  // eslint-disable-next-line no-new-func
  return new Function(`return (${src});`)();
}

// ---------------------------------------------------------------------------
// Variant plans
// ---------------------------------------------------------------------------

/** Floor / vapor-style: one generated function rendering the whole scene. */
export function makeInlinePlan(scene) {
  const { fnSrc } = genCreate(scene, 'inline');
  return { render: compileFn(fnSrc), src: fnSrc };
}

/**
 * Block plan (route b/Q2): the scene is one block whose skeleton is a
 * template with holes; each list body is an item block template.
 */
export function makeBlockPlan(scene) {
  // Root skeleton: the scene with lists left as slots.
  const root = genCreate(scene, 'holes');
  const lists = [];
  const visit = (n) => {
    if (n.each) {
      const item = genCreate(n.body, 'holes');
      lists.push({
        each: n.each,
        keyField: n.keyField,
        create: compileFn(item.fnSrc),
        holes: item.holes,
      });
      return;
    }
    for (const c of n.children ?? []) if (!isTextPart(c)) visit(c);
  };
  visit(scene);
  return {
    create: compileFn(root.fnSrc),
    holes: root.holes,
    slots: root.slots,
    lists,
  };
}

/**
 * Template rewrites for the vdom-hybrid variants:
 *  - staticTplTemplate: fully-static islands → <sta-N> custom tags
 *  - blockTplTemplate: whole blocks → <tpl-N> tags with :hK hole props
 * Both return { template, registry } where registry maps tag → plan.
 */
export function makeStaticTplTemplate(scene) {
  const registry = new Map();
  let n = 0;
  const transform = (node, extra) => {
    // Never swallow the v-for host into an island.
    if (extra === '' && isStaticNode(node)) {
      const tag = `sta-${n++}`;
      const { fnSrc } = genCreate(node, 'inline');
      registry.set(tag, { create: compileFn(fnSrc) });
      return `<${tag}></${tag}>`;
    }
    return null;
  };
  const template = toTemplate(scene, transform);
  return { template, registry };
}

export function makeBlockTplTemplate(scene) {
  const registry = new Map();
  let n = 0;

  const lowerBlock = (node) => {
    const plan = genCreate(node, 'holes');
    const tag = `tpl-${n++}`;
    registry.set(tag, {
      create: compileFn(plan.fnSrc),
      holes: plan.holes,
      slots: plan.slots,
    });
    // Hole props: hK bound to the original expression (item-scoped fields
    // reference the v-for `item`, everything else a top-level data key).
    let attrs = '';
    plan.holes.forEach((h, i) => {
      const expr = h.item !== undefined ? `item.${h.item}` : h.key;
      attrs += ` :h${i}="${expr}"`;
    });
    // Slot children: the (single) list inside this block mounts as children.
    let kids = '';
    const visit = (nn) => {
      if (nn.each) {
        const itemTag = lowerBlock(nn.body);
        kids += `<${itemTag.tag}${itemTag.attrs} v-for="item in ${nn.each}" :key="item.${nn.keyField}"></${itemTag.tag}>`;
        return;
      }
      for (const c of nn.children ?? []) if (!isTextPart(c)) visit(c);
    };
    visit(node);
    return { tag, attrs, kids };
  };

  const root = lowerBlock(scene);
  const template = `<${root.tag}${root.attrs}>${root.kids}</${root.tag}>`;
  return { template, registry };
}
