import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const vueLynxRoot = path.resolve(_dirname, '../vue-lynx');

const ALIASES = new Map([
  ['vue-lynx', path.join(vueLynxRoot, 'runtime/dist/index.js')],
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
