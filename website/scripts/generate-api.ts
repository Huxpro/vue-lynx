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
  /**
   * Skip pages for re-exported external symbols. Used for the vapor entry, whose
   * surface is dominated by @vue/runtime-core / @vue/runtime-vapor
   * re-exports — documented on vuejs.org, and whose upstream doc comments
   * contain raw template markup that breaks MDX compilation.
   */
  excludeExternals?: boolean;
};

const packages = [
  {
    label: 'vue-lynx',
    dirName: 'vue-lynx',
    entryPoints: [path.join(repoRoot, 'packages/vue-lynx/runtime/src/index.ts')],
    homepageFileName: 'index',
    showHomepageInSidebar: false,
  },
  {
    label: 'vue-lynx/vapor',
    dirName: 'vapor',
    entryPoints: [path.join(repoRoot, 'packages/vue-lynx/runtime/src/vapor-app.ts')],
    homepageFileName: 'index',
    showHomepageInSidebar: false,
    excludeExternals: true,
  },
  {
    label: 'vue-lynx/plugin',
    dirName: 'plugin',
    entryPoints: [path.join(repoRoot, 'packages/vue-lynx/plugin/src/index.ts')],
    homepageFileName: 'index',
    showHomepageInSidebar: false,
  },
  {
    label: 'vue-lynx/testing-library',
    dirName: 'testing-library',
    entryPoints: [path.join(repoRoot, 'packages/testing-library/src/index.ts')],
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
  'Variable.Page',
  'Interface.VueLynxApp',
  'Function.nextTick',
  'Class.MainThreadRef',
  'Function.useMainThreadRef',
  'Function.runOnMainThread',
  'Function.runOnBackground',
  'Function.transformToWorklet',
]);

// Lynx-facing APIs of the pure Vapor entry — the only sidebar entries for
// vue-lynx/vapor-app. Everything else it exports is either a Vue re-export
// (documented on vuejs.org) or a compiler-emitted helper users never import.
const VAPOR_APIS = new Set([
  'Function.createApp',
  'Interface.VueLynxApp',
  'Function.nextTick',
  'Class.MainThreadRef',
  'Function.useMainThreadRef',
  'Function.runOnMainThread',
  'Function.runOnBackground',
  'Function.transformToWorklet',
  'Function.useVaporCssVars',
  'Function.withModifiers',
]);

// dirName → curated sidebar allowlist (packages whose full surface is
// dominated by re-exports).
const SIDEBAR_ALLOWLISTS: Record<string, Set<string>> = {
  'vue-lynx': VUE_LYNX_APIS,
  vapor: VAPOR_APIS,
};

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

  // Packages dominated by re-exports only show their curated APIs in the
  // sidebar. Re-exports are still generated (accessible from the index page)
  // but don't need sidebar entries — users can look them up at vuejs.org.
  const allowlist = SIDEBAR_ALLOWLISTS[dirName];
  if (allowlist) {
    return allFiles
      .filter((name) => allowlist.has(name))
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
  excludeExternals = false,
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
      excludeExternals,
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
| \`<KeepAlive>\` | Supported | Caches inactive component instances. Supports \`include\`, \`exclude\`, and \`max\` props. |
| \`<Teleport>\` | Supported | Supports \`to="#id"\` string selectors only. Direct element refs and non-ID selectors are not yet supported. |

:::warning
\`<Transition>\` and \`<TransitionGroup>\` are **experimental**. Always pass an explicit \`:duration\` prop — \`getComputedStyle()\` is unavailable from the background thread. Move (FLIP) animations in \`<TransitionGroup>\` are not supported.
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
 * Rewrite the vapor-app index.mdx: intro to the pure Vapor entry, curated
 * Lynx API table, then everything else (Vue re-exports + Vapor compiler
 * helpers) in one lookup table.
 */
async function rewriteVaporAppIndex(outputDir: string) {
  const entries = await fs.readdir(outputDir, { withFileTypes: true });
  const allFiles = entries
    .filter((e) => e.isFile() && /\.mdx?$/.test(e.name))
    .map((e) => e.name.replace(/\.mdx?$/, ''))
    .filter((n) => n !== 'index');

  const lynxApis = allFiles
    .filter((n) => VAPOR_APIS.has(n))
    .sort((a, b) => a.localeCompare(b));

  const rest = allFiles
    .filter((n) => !VAPOR_APIS.has(n) && !HIDDEN_APIS.has(n))
    .sort((a, b) => a.localeCompare(b));

  const fmtRow = (name: string) => {
    const [kind, api] = name.split('.');
    return `| [${api}](${name}.mdx) | ${kind} |`;
  };

  const md = `# vue-lynx/vapor

The **pure Vapor** application entry. With \`pluginVueLynx({ vapor: true })\`,
\`'vue'\` is aliased to this module — it provides everything a Vapor app
imports from \`'vue'\` (reactivity, lifecycle, watchers, DI, SFC macros, the
Vapor helper surface) **without** the vdom renderer. See the
[Vapor Mode guide](/guide/vapor-mode) for how the mode works and its
current limitations.

\`\`\`ts
import { createApp } from 'vue-lynx/vapor'
import App from './App.vue'

createApp(App).mount()
\`\`\`

vdom-only APIs (\`h()\`, \`render()\`, \`<Transition>\`, \`<Teleport>\`,
\`<KeepAlive>\`, \`<Suspense>\`, \`vShow\`, \`vModelText\`,
\`vaporInteropPlugin\`) are **intentionally absent** — importing them in a
Vapor app fails at build time instead of misbehaving at runtime.

## Vue Lynx APIs

APIs specific to Lynx's dual-thread architecture. They behave identically
to their \`vue-lynx\` (vdom entry) counterparts:

| Name | Kind |
| ------ | ------ |
${lynxApis.map(fmtRow).join('\n')}

## Vue Re-exports

The standard Vue 3 surface — \`ref\`, \`reactive\`, \`computed\`, \`watch\`,
lifecycle hooks, \`provide\`/\`inject\`, SFC macros, \`useCssModule\`, and the
rest of \`@vue/runtime-core\` — is re-exported unchanged and behaves exactly
as documented in the [Vue.js API Reference](https://vuejs.org/api/). The
\`@vue/runtime-vapor\` helper surface that compiled
\`<script setup vapor>\` code imports (\`template\`, \`createComponent\`,
\`createFor\`, \`renderEffect\`, …) is also re-exported — you rarely touch it
directly.

## Lynx Vapor Adapters

Lynx-specific pieces of the Vapor surface (mostly compiler-facing —
compiled \`<script setup vapor>\` output imports these):

| Name | Kind |
| ------ | ------ |
${rest.map(fmtRow).join('\n')}
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

For setup instructions and examples, see the [VueLynx Testing Library guide](/guide/testing-library).

## Quick Example

\`\`\`ts
import { expect, it, vi } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';

it('fires tap event', () => {
  const onClick = vi.fn();
  const Comp = defineComponent({
    setup() {
      return () => h('view', { bindtap: onClick }, [
        h('text', null, 'Click me'),
      ]);
    },
  });

  const { container, getByText } = render(Comp);
  fireEvent.tap(container.querySelector('view')!);

  expect(onClick).toHaveBeenCalledTimes(1);
  expect(getByText('Click me')).not.toBeNull();
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
    'excludeExternals' in pkg ? pkg.excludeExternals : false,
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
await rewriteVaporAppIndex(path.join(apiOutputDir, 'vapor'));
await rewriteTestingLibraryIndex(path.join(apiOutputDir, 'testing-library'));

// Write sidebar JSON for rspress.config.ts to import
await fs.writeFile(
  path.join(websiteRoot, 'api-sidebar.json'),
  `${JSON.stringify(sidebarGroups, null, 2)}\n`,
);

// Mirror API docs to zh locale. vue-lynx and testing-library keep hand-written
// zh index.mdx; other packages copy the generated English index so relative
// links like [pkg](index.mdx) in member pages resolve under /zh/guide/api/.
const zhApiOutputDir = path.join(websiteRoot, 'docs/zh/guide/api');
const zhTranslatedIndexDirs = new Set(['vue-lynx', 'testing-library']);
await fs.mkdir(zhApiOutputDir, { recursive: true });

for (const pkg of packages) {
  const srcDir = path.join(apiOutputDir, pkg.dirName);
  const destDir = path.join(zhApiOutputDir, pkg.dirName);
  // Clean the mirror first — stale pages from earlier generations would
  // otherwise survive (only the en side is cleaned by generatePackageDocs).
  if (zhTranslatedIndexDirs.has(pkg.dirName)) {
    // Preserve only the hand-written zh index.mdx.
    const existing = await fs.readdir(destDir, { withFileTypes: true }).catch(() => []);
    for (const file of existing) {
      if (file.isFile() && file.name !== 'index.mdx') {
        await fs.rm(path.join(destDir, file.name));
      }
    }
  } else {
    await fs.rm(destDir, { recursive: true, force: true });
  }
  await fs.mkdir(destDir, { recursive: true });

  const files = await fs.readdir(srcDir, { withFileTypes: true });
  for (const file of files) {
    if (!file.isFile()) continue;
    if (file.name === 'index.mdx' && zhTranslatedIndexDirs.has(pkg.dirName)) {
      continue;
    }
    await fs.copyFile(
      path.join(srcDir, file.name),
      path.join(destDir, file.name),
    );
  }
}
