import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Application, TSConfigReader } from 'typedoc';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const websiteRoot = path.resolve(__dirname, '..');

type ApiPackageConfig = {
  label: string;
  dirName: string;
  entryPoints: string[];
  homepageFileName?: string;
  showHomepageInSidebar?: boolean;
};

const packages = [
  {
    label: 'vue-lynx',
    dirName: 'vue-lynx',
    entryPoints: [path.join(repoRoot, 'runtime/src/index.ts')],
    homepageFileName: 'index',
    showHomepageInSidebar: false,
  },
  {
    label: 'vue-lynx/plugin',
    dirName: 'plugin',
    entryPoints: [path.join(repoRoot, 'plugin/src/index.ts')],
    homepageFileName: 'index',
    showHomepageInSidebar: false,
  },
  {
    label: 'vue-lynx/testing-library',
    dirName: 'testing-library',
    entryPoints: [path.join(repoRoot, 'testing-library/src/index.ts')],
    homepageFileName: 'index',
    showHomepageInSidebar: false,
  },
] satisfies ApiPackageConfig[];

// Internal APIs that should not appear in docs.
// @hidden/@internal doesn't work on bare re-exports, so we filter them here.
const HIDDEN_APIS = new Set([
  // Template compiler runtime helpers
  'Function.cloneVNode',
  'Function.createVNode',
  'Function.createElementVNode',
  'Function.isVNode',
  'Function.normalizeClass',
  'Function.normalizeStyle',
  'Function.normalizeProps',
  'Function.withDirectives',
  'Function.withMemo',
  // Testing internals
  'Class.ShadowElement',
  'Variable.nodeOps',
  'Function.takeOps',
  // VNode type symbols (compiler internals)
  'Variable.Text',
  'Variable.Comment',
  // Directive object (used via v-show in templates, not imported directly)
  'Variable.vShow',
  // Internal plugin constants
  'Variable.LAYERS',
]);

// Vue Lynx specific APIs — shown first in the vue-lynx sidebar
const VUE_LYNX_APIS = new Set([
  'Function.createApp',
  'Interface.VueLynxApp',
  'Function.nextTick',
  'Class.MainThreadRef',
  'Function.useMainThreadRef',
  'Function.runOnMainThread',
  'Function.runOnBackground',
  'Function.transformToWorklet',
]);

/** Read generated .mdx files and return sidebar items for a package */
async function collectSidebarItems(
  outputDir: string,
  dirName: string,
  homepageFileName: string,
  showHomepageInSidebar: boolean,
) {
  const entries = await fs.readdir(outputDir, { withFileTypes: true });
  const allFiles = entries
    .filter((entry) => entry.isFile() && /\.(md|mdx)$/.test(entry.name))
    .map((entry) => entry.name.replace(/\.(md|mdx)$/, ''))
    .filter((name) => name !== '_meta')
    .filter((name) => showHomepageInSidebar || name !== homepageFileName)
    .filter((name) => !HIDDEN_APIS.has(name));

  const toItem = (name: string) => ({
    // "Function.createApp" → "Function: createApp"
    text: name.replace('.', ': '),
    link: `/guide/api/${dirName}/${name}`,
  });

  // For the main vue-lynx package, only show Vue Lynx specific APIs in sidebar.
  // Vue re-exports are still generated (accessible from the index page) but
  // don't need sidebar entries — users can look them up at vuejs.org.
  if (dirName === 'vue-lynx') {
    return allFiles
      .filter((name) => VUE_LYNX_APIS.has(name))
      .sort((a, b) => a.localeCompare(b))
      .map(toItem);
  }

  return allFiles.sort((a, b) => a.localeCompare(b)).map(toItem);
}

async function generatePackageDocs(
  name: string,
  entryPoints: string[],
  outputDir: string,
  homepageFileName = 'index',
  _showHomepageInSidebar = false,
) {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const app = await Application.bootstrapWithPlugins(
    {
      name,
      entryPoints,
      entryPointStrategy: 'resolve',
      tsconfig: path.join(websiteRoot, 'tsconfig.typedoc.json'),
      plugin: ['typedoc-plugin-markdown'],
      readme: 'none',
      fileExtension: '.mdx',
      flattenOutputFiles: true,
      entryFileName: homepageFileName,
      outputFileStrategy: 'members',
      hidePageHeader: true,
      useCodeBlocks: true,
      mergeReadme: true,
      parametersFormat: 'table',
      interfacePropertiesFormat: 'table',
      classPropertiesFormat: 'table',
      indexFormat: 'table',
      sort: ['source-order'],
      excludePrivate: true,
      excludeInternal: true,
    },
    [new TSConfigReader()],
  );

  const project = await app.convert();
  if (!project) {
    throw new Error(`TypeDoc failed for ${name}`);
  }

  await app.generateDocs(project, outputDir);
}

/**
 * Rewrite the vue-lynx index.mdx to separate Vue Lynx APIs from Vue re-exports.
 * The generated index mixes everything; we replace it with a curated page.
 */
async function rewriteVueLynxIndex(outputDir: string) {
  const entries = await fs.readdir(outputDir, { withFileTypes: true });
  const allFiles = entries
    .filter((e) => e.isFile() && /\.mdx?$/.test(e.name))
    .map((e) => e.name.replace(/\.mdx?$/, ''))
    .filter((n) => n !== 'index');

  const lynxApis = allFiles
    .filter((n) => VUE_LYNX_APIS.has(n))
    .sort((a, b) => a.localeCompare(b));

  const vueReexports = allFiles
    .filter((n) => !VUE_LYNX_APIS.has(n) && !HIDDEN_APIS.has(n))
    .sort((a, b) => a.localeCompare(b));

  const fmtRow = (name: string) => {
    const [kind, api] = name.split('.');
    return `| [${api}](${name}.mdx) | ${kind} |`;
  };

  const md = `# vue-lynx

Welcome to the API reference for \`vue-lynx\`, the package that provides the Vue 3 framework for building Lynx apps. For an introduction, see the [Getting Started](/guide/introduction) guide.

## Vue APIs

Vue Lynx uses Vue 3's \`@vue/runtime-core\` directly — the reactivity system, component model, lifecycle hooks, and Composition API are all standard Vue. You can expect these APIs to behave consistently with the [official Vue 3 documentation](https://vuejs.org/api/) unless otherwise noted below.

This means \`ref()\`, \`reactive()\`, \`computed()\`, \`watch()\`, \`onMounted()\`, \`defineComponent()\`, and all other Vue Composition APIs work exactly as documented on [vuejs.org](https://vuejs.org/api/). The only difference is that you import them from \`vue-lynx\` instead of \`vue\`:

\`\`\`ts
import { ref, computed, onMounted, defineComponent } from 'vue-lynx';
\`\`\`

## Vue Lynx APIs

The following APIs are specific to Vue Lynx's dual-thread architecture (Background Thread renderer + Main Thread native elements):

| Name | Kind |
| ------ | ------ |
${lynxApis.map(fmtRow).join('\n')}

## Built-in Components

| Component | Status | Notes |
| --------- | ------ | ----- |
| \`<Transition>\` | Experimental | CSS class-based enter/leave animations. Requires explicit \`:duration\` prop — \`getComputedStyle()\` is unavailable from the background thread. |
| \`<TransitionGroup>\` | Experimental | Per-child enter/leave animations. Move (FLIP) animations not supported — \`getBoundingClientRect()\` is unavailable from the background thread. |
| \`<Suspense>\` | Supported | Re-exported from Vue. Works with \`defineAsyncComponent()\`. |
| \`<KeepAlive>\` | Not Supported | Requires element recycling not available in Lynx renderer. |
| \`<Teleport>\` | Not Supported | Requires \`querySelector\` renderer option not implemented. |

:::warning
\`<Transition>\` and \`<TransitionGroup>\` are **experimental**. See the [Transition guide](/guide/transition) for usage details and differences from Vue DOM.
:::

<Go example="transition" defaultFile="src/App.vue" defaultEntryFile="dist/transition.lynx.bundle" />

## Vue Re-exports

Standard Vue 3 APIs re-exported from \`vue-lynx\`. See [Vue.js API Reference](https://vuejs.org/api/) for full documentation.

| Name | Kind |
| ------ | ------ |
${vueReexports.map(fmtRow).join('\n')}
`;

  await fs.writeFile(path.join(outputDir, 'index.mdx'), md);
}

/**
 * Rewrite the testing-library index.mdx with setup/usage docs,
 * modeled after @lynx-js/react/testing-library.
 */
async function rewriteTestingLibraryIndex(outputDir: string) {
  const entries = await fs.readdir(outputDir, { withFileTypes: true });
  const allFiles = entries
    .filter((e) => e.isFile() && /\.mdx?$/.test(e.name))
    .map((e) => e.name.replace(/\.mdx?$/, ''))
    .filter((n) => n !== 'index' && !HIDDEN_APIS.has(n));

  const fmtRow = (name: string) => {
    const [kind, api] = name.split('.');
    return `| [${api}](${name}.mdx) | ${kind} |`;
  };

  const md = `# vue-lynx/testing-library

Vue Lynx Testing Library provides simple utilities for testing Vue 3 Lynx components in a Node.js environment. It renders components through the full dual-thread pipeline (Background Thread renderer → Main Thread native elements → JSDOM) so your tests exercise the same code path as production.

> Inspired by [Vue Testing Library](https://testing-library.com/docs/vue-testing-library/intro/) and [@lynx-js/react/testing-library](https://lynxjs.org/api/reactlynx-testing-library/)

## Setup

Install and configure vitest with \`@lynx-js/testing-environment\`:

\`\`\`js
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: '@lynx-js/testing-environment',
  },
});
\`\`\`

## Usage

\`\`\`vue
<!-- Counter.vue -->
<script setup>
import { ref } from 'vue-lynx';
const count = ref(0);
<\/script>

<template>
  <view>
    <text data-testid="count">{{ count }}</text>
    <text data-testid="increment" bindtap="count++">+1</text>
  </view>
</template>
\`\`\`

\`\`\`ts
import { test, expect } from 'vitest';
import { render, fireEvent } from 'vue-lynx/testing-library';
import Counter from './Counter.vue';

test('increments count on tap', async () => {
  const { getByTestId } = render(Counter);

  expect(getByTestId('count').textContent).toBe('0');

  await fireEvent(getByTestId('increment'), 'tap');
  expect(getByTestId('count').textContent).toBe('1');
});
\`\`\`

Auto-cleanup is built in — after each test, the rendered app is automatically unmounted and the JSDOM is reset.

## API Reference

| Name | Kind |
| ------ | ------ |
${allFiles.sort((a, b) => a.localeCompare(b)).map(fmtRow).join('\n')}
`;

  await fs.writeFile(path.join(outputDir, 'index.mdx'), md);
}

const apiOutputDir = path.join(websiteRoot, 'docs/guide/api');

// Generate docs and collect sidebar items for each package
const sidebarGroups = [];
for (const pkg of packages) {
  const outputDir = path.join(apiOutputDir, pkg.dirName);
  await generatePackageDocs(
    pkg.label,
    pkg.entryPoints,
    outputDir,
    pkg.homepageFileName,
    pkg.showHomepageInSidebar,
  );
  const items = await collectSidebarItems(
    outputDir,
    pkg.dirName,
    pkg.homepageFileName ?? 'index',
    pkg.showHomepageInSidebar ?? false,
  );
  sidebarGroups.push({
    text: pkg.label,
    link: `/guide/api/${pkg.dirName}/`,
    collapsible: true,
    collapsed: true,
    items,
  });
}

// Rewrite index pages with curated sections
await rewriteVueLynxIndex(path.join(apiOutputDir, 'vue-lynx'));
await rewriteTestingLibraryIndex(path.join(apiOutputDir, 'testing-library'));

// Write sidebar JSON for rspress.config.ts to import
await fs.writeFile(
  path.join(websiteRoot, 'api-sidebar.json'),
  `${JSON.stringify(sidebarGroups, null, 2)}\n`,
);
