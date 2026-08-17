import { describe, expect, it } from 'vitest';

import vueScopedCSSSplitLoader from '../../../vue-lynx/plugin/src/loaders/vue-scoped-css-split-loader.js';
import { splitVueScopedCSS } from '../../../vue-lynx/plugin/src/plugins/vue-scoped-cssid-plugin.js';

const loaderContext = {
  context: '/project/src',
  resourcePath: '/project/src/Example.vue',
  resourceQuery:
    '?vue&type=style&index=0&id=abcd1234&scoped=true&lang=css&cssId=734794292',
};

describe('Vue scoped CSS fragment routing', () => {
  it('routes a compiled :global rule to common without moving scoped rules', () => {
    const css = [
      '.ordinary[data-v-abcd1234] { color: red; }',
      '.global { color: blue; }',
    ].join('\n');

    const { component, common } = splitVueScopedCSS(css, 'data-v-abcd1234');

    expect(component).toContain('.ordinary[data-v-abcd1234]');
    expect(component).not.toContain('.global');
    expect(common).toContain('.global');
    expect(common).not.toContain('.ordinary[data-v-abcd1234]');
  });

  it('emits component and common request variants for mixed scoped CSS', () => {
    const css = [
      '.ordinary[data-v-abcd1234] { color: red; }',
      '.global { color: blue; }',
    ].join('\n');

    const component = vueScopedCSSSplitLoader.call(loaderContext, css);
    const common = vueScopedCSSSplitLoader.call(
      {
        ...loaderContext,
        resourceQuery: `${loaderContext.resourceQuery}&common=true`,
      },
      css,
    );

    expect(component).toContain('.ordinary[data-v-abcd1234]');
    expect(component).not.toContain('.global {');
    expect(component).toContain('Example.vue?vue&type=style');
    expect(component).not.toContain('%3Fvue');
    expect(component).toContain('cssId=734794292&common=true');
    expect(common).toContain('.global {');
    expect(common).not.toContain('.ordinary[data-v-abcd1234]');
    expect(common).not.toContain('@import');
  });

  it('does not create a common request when every selector is scoped', () => {
    const css = '.ordinary[data-v-abcd1234] { color: red; }';

    expect(vueScopedCSSSplitLoader.call(loaderContext, css)).toBe(css);
  });

  it('passes non-scoped style requests through unchanged', () => {
    const css = '.global { color: blue; }';

    expect(vueScopedCSSSplitLoader.call(
      {
        ...loaderContext,
        resourceQuery: '?vue&type=style&index=0&id=abcd1234&lang=css',
      },
      css,
    )).toBe(css);
  });
});
