// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Build-time check for worklets that the background thread references but the
 * main thread never registers.
 *
 * Every `'main thread'` worklet becomes a background-thread object carrying a
 * `_wkltId: "<hash>"` and a matching main-thread
 * `registerWorkletInternal("main-thread", "<hash>", fn)`. When the two sets
 * drift — a module the MT loader never reached, an extraction bug, a package
 * missing from `includeWorkletPackages` — the background id resolves to
 * nothing and the app crashes on first interaction with
 * `cannot read property 'bind' of undefined`. That crash is the single most
 * common worklet failure, and nothing surfaces it at build time today.
 *
 * The check runs on the raw JS chunk assets before LynxTemplatePlugin packages
 * them into the `.lynx.bundle` binary (where registrations are no longer text).
 * It uses the same main-thread filename list the mark plugin gets, so it never
 * has to guess which asset is which.
 */

const PLUGIN_NAME = 'vue-lynx:worklet-registration-check';

/** How the check reports a drift. */
export type WorkletCheckSeverity = 'error' | 'warn' | 'off';

// Hashes are the second argument of registerWorkletInternal(type, hash, fn)
// and the value of a `_wkltId` property. Sources may be raw JS or a
// JSON-escaped code string inside a bundle envelope, so a leading backslash
// before each quote is tolerated (see normalize()).
const REGISTERED_RE = /registerWorkletInternal\(\s*"[^"]*"\s*,\s*"([^"]+)"/g;
const REFERENCED_RE = /_wkltId\s*:\s*"([^"]+)"/g;

/** Collapse `\"` to `"` so escaped bundle envelopes and raw JS scan alike. */
function normalize(code: string): string {
  return code.includes('\\"') ? code.replace(/\\"/g, '"') : code;
}

function collect(re: RegExp, sources: readonly string[]): Set<string> {
  const ids = new Set<string>();
  for (const raw of sources) {
    const code = normalize(raw);
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) ids.add(m[1]!);
  }
  return ids;
}

/** Worklet ids registered on the main thread. */
export function collectRegisteredIds(mtSources: readonly string[]): Set<string> {
  return collect(REGISTERED_RE, mtSources);
}

/** Worklet ids referenced by any thread's `_wkltId`. */
export function collectReferencedIds(sources: readonly string[]): Set<string> {
  return collect(REFERENCED_RE, sources);
}

/**
 * Referenced-but-unregistered worklet ids, sorted for stable output.
 *
 * Returns `[]` (no finding) when nothing is registered at all: a build with
 * references but zero registrations means the check ran against already
 * packaged output rather than the raw chunks, and reporting every id as
 * unresolved would be a false alarm, not a diagnosis.
 */
export function findUnresolvedWorklets(input: {
  mtSources: readonly string[];
  allSources: readonly string[];
}): string[] {
  const registered = collectRegisteredIds(input.mtSources);
  const referenced = collectReferencedIds(input.allSources);
  if (registered.size === 0) return [];
  const unresolved: string[] = [];
  for (const id of referenced) {
    if (!registered.has(id)) unresolved.push(id);
  }
  return unresolved.sort();
}

/** Human-readable, actionable build message for a set of unresolved ids. */
export function formatUnresolvedMessage(unresolved: readonly string[]): string {
  const shown = unresolved.slice(0, 20);
  const more = unresolved.length - shown.length;
  const list = shown.map((id) => `  - ${id}`).join('\n')
    + (more > 0 ? `\n  …and ${more} more` : '');
  return `[vue-lynx] ${unresolved.length} worklet(s) are referenced on the `
    + `background thread but never registered on the main thread:\n${list}\n`
    + `This crashes at runtime with "cannot read property 'bind' of undefined" `
    + `on first interaction. Common causes: a 'main thread' module the MT loader `
    + `never reached (add its package to includeWorkletPackages), or a worklet `
    + `that failed to extract into the MT bundle.`;
}

export class WorkletRegistrationCheckPlugin {
  constructor(
    private readonly mainThreadFilenames: readonly string[],
    private readonly severity: Exclude<WorkletCheckSeverity, 'off'> = 'warn',
  ) {}

  // biome-ignore lint/suspicious/noExplicitAny: rspack/webpack compiler type not importable
  apply(compiler: any): void {
    const mtSet = new Set(this.mainThreadFilenames);
    // biome-ignore lint/suspicious/noExplicitAny: rspack/webpack compilation type not importable
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation: any) => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          // After chunks are generated but before LynxTemplatePlugin encodes
          // them into the binary bundle, where registrations stop being text.
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
        },
        () => {
          const mtSources: string[] = [];
          const allSources: string[] = [];
          // biome-ignore lint/suspicious/noExplicitAny: rspack/webpack asset type not importable
          for (const asset of compilation.getAssets() as any[]) {
            const name: string = asset.name;
            if (!name.endsWith('.js')) continue;
            const src = asset.source?.source?.();
            if (src == null) continue;
            const code = typeof src === 'string' ? src : src.toString('utf8');
            allSources.push(code);
            if (mtSet.has(name)) mtSources.push(code);
          }

          const unresolved = findUnresolvedWorklets({ mtSources, allSources });
          if (unresolved.length === 0) return;

          const error = new Error(formatUnresolvedMessage(unresolved));
          error.name = 'WorkletRegistrationError';
          if (this.severity === 'error') compilation.errors.push(error);
          else compilation.warnings.push(error);
        },
      );
    });
  }
}
