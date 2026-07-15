import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(pkgRoot, 'dist', 'index.js');
const versionsJsonPath = path.join(pkgRoot, 'dist', 'versions.json');

const vueLynxVersion = (
  JSON.parse(
    fs.readFileSync(path.resolve(pkgRoot, '../vue-lynx/package.json'), 'utf-8'),
  ) as { version: string }
).version;

// Scaffold into a temp dir OUTSIDE the pnpm workspace, like a real
// `npx create-vue-lynx` user — the workspace: protocol only resolves inside
// the monorepo, so any leak must be caught here, not masked by the workspace.
let tmpRoot: string;

beforeAll(() => {
  expect(fs.existsSync(cliPath), 'CLI must be built before tests (npm run build)').toBe(true);
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-vue-lynx-test-'));
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

function scaffold(appName: string, template: string): Record<string, unknown> & {
  raw: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  execFileSync(
    process.execPath,
    [cliPath, appName, '--template', template, '--tools', 'none'],
    { cwd: tmpRoot, stdio: 'pipe' },
  );
  const raw = fs.readFileSync(path.join(tmpRoot, appName, 'package.json'), 'utf-8');
  return { ...JSON.parse(raw), raw };
}

describe.each(['vue-ts', 'vue-js'])('template %s', (template) => {
  it('scaffolds a package.json without the workspace: protocol', () => {
    const pkg = scaffold(`app-${template}`, template);

    expect(pkg.raw).not.toContain('workspace:');

    for (const deps of [pkg.dependencies, pkg.devDependencies]) {
      for (const [name, spec] of Object.entries(deps ?? {})) {
        expect(spec, `dependency "${name}" must be installable outside the monorepo`).not.toMatch(
          /^workspace:/,
        );
      }
    }
  });

  it('pins vue-lynx to the workspace version', () => {
    const pkg = scaffold(`app-pinned-${template}`, template);
    expect(pkg.dependencies['vue-lynx']).toBe(`^${vueLynxVersion}`);
    expect(pkg.dependencies.vue).toMatch(/^\^\d/);
  });
});

it('falls back to "latest" when dist/versions.json is missing', () => {
  const backupPath = `${versionsJsonPath}.bak`;
  fs.renameSync(versionsJsonPath, backupPath);
  try {
    const pkg = scaffold('app-fallback', 'vue-ts');
    expect(pkg.raw).not.toContain('workspace:');
    expect(pkg.dependencies['vue-lynx']).toBe('latest');
  } finally {
    fs.renameSync(backupPath, versionsJsonPath);
  }
});
