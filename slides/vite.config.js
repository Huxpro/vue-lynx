import { defineConfig } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

const examplesSource = path.resolve(__dirname, '../website/docs/public/examples');
const examplesDest = path.resolve(__dirname, 'public/examples');
// pnpm hoists workspace deps into the repo-root .pnpm/ store; the lynx runtime
// fetches its wasm + worker bundles from there at runtime, so we need to whitelist it.
const workspaceRoot = path.resolve(__dirname, '..');

// Ensure examples are reachable from /examples at dev + build time.
function ensureExamplesSymlink() {
  if (!fs.existsSync(examplesSource)) return;
  try {
    const stat = fs.lstatSync(examplesDest);
    if (stat.isSymbolicLink() || stat.isDirectory()) return;
  } catch {
    // not present
  }
  try {
    fs.mkdirSync(path.dirname(examplesDest), { recursive: true });
    const relativeTarget = path.relative(path.dirname(examplesDest), examplesSource);
    fs.symlinkSync(relativeTarget, examplesDest, 'dir');
  } catch (err) {
    console.warn('[slides] could not symlink examples:', err.message);
  }
}
ensureExamplesSymlink();

// Optional localhost presenter aid: mount Evan Bacon's serve-sim preview at
// /.sim during `pnpm dev` only (`configureServer` never runs in production /
// Vercel builds, so cloud-hosted decks stay unaffected). The floating overlay
// is toggled from the command palette on loopback hosts. Start the helper:
//   npx serve-sim --detach
function serveSimPlugin() {
  return {
    name: 'serve-sim',
    async configureServer(server) {
      try {
        const { simMiddleware } = await import('serve-sim/middleware');
        const middleware = simMiddleware({ basePath: '/.sim' });
        server.middlewares.use(middleware);
        console.log('[slides] serve-sim at /.sim  (palette → m · run: npx serve-sim --detach)');
      } catch (err) {
        console.warn('[slides] serve-sim middleware unavailable:', err?.message ?? err);
      }
    },
  };
}

export default defineConfig({
  // When built for the docs site it is served under /deck/ (see
  // website/scripts/prepare-deck.mjs); standalone dev/build stays at root.
  base: process.env.DECK_BASE || '/',
  // web-core ships top-level await — needs ES2022+
  esbuild: { target: 'es2022' },
  plugins: [serveSimPlugin()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        speaker: path.resolve(__dirname, 'speaker.html'),
        play: path.resolve(__dirname, 'play.html'),
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: { target: 'es2022' },
    // The Lynx runtime fetches its WASM via `new URL('../../binary/.../client_bg.wasm', import.meta.url)`.
    // Pre-bundling rewrites `import.meta.url` to point at node_modules/.vite/deps/chunk-X.js,
    // and the relative `binary/` path no longer resolves. Excluding keeps the original ESM tree
    // intact so the wasm + worker-companion JS files are served correctly.
    exclude: ['@lynx-js/web-core', '@lynx-js/web-elements'],
  },
  assetsInclude: ['**/*.wasm'],
  // web-core's worker uses code splitting, which requires an ES module worker.
  worker: {
    format: 'es',
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname), examplesSource, workspaceRoot],
    },
    watch: {
      // Don't watch the symlinked example bundles — they make HMR pointless
      ignored: ['**/public/examples/**'],
    },
  },
});
