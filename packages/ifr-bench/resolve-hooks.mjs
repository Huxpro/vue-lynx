import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const vueLynxRoot = path.resolve(_dirname, '../vue-lynx');
const workspaceNodeModules = path.resolve(_dirname, '../../node_modules');

const ALIASES = new Map([
  // Node prefers Vue's `node` (CJS) export condition, which intentionally
  // omits compiler/runtime-internal bindings consumed by runtime-vapor.
  // The app build uses the ESM-bundler files, so the benchmark must too.
  [
    '@vue/runtime-core',
    path.join(workspaceNodeModules, '@vue/runtime-core/dist/runtime-core.esm-bundler.js'),
  ],
  [
    '@vue/runtime-dom',
    path.join(workspaceNodeModules, '@vue/runtime-dom/dist/runtime-dom.esm-bundler.js'),
  ],
  ['vue-lynx', path.join(vueLynxRoot, 'runtime/dist/index.js')],
  ['vue-lynx/vapor', path.join(vueLynxRoot, 'runtime/dist/vapor-app.js')],
  ['vue-lynx/internal/ops', path.join(vueLynxRoot, 'internal/dist/ops.js')],
  ['vue-lynx/main-thread', path.join(vueLynxRoot, 'main-thread/dist/entry-main.js')],
]);

export function resolve(specifier, context, nextResolve) {
  const target = ALIASES.get(specifier);
  if (target) {
    return { url: pathToFileURL(target).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
