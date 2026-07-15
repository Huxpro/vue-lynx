#!/usr/bin/env node

/**
 * Generates dist/versions.json — the version map used to rewrite template
 * dependencies at scaffold time.
 *
 * The map starts from this package's devDependencies. Entries that use the
 * pnpm `workspace:` protocol (e.g. "vue-lynx": "workspace:*") are resolved to
 * a real semver range (`^<version>`) by reading the sibling workspace
 * package's package.json. Without this step, scaffolded apps outside the
 * monorepo would inherit `workspace:*` and fail `npm install` with
 * EUNSUPPORTEDPROTOCOL.
 *
 * Runs as part of `npm run build`, which also runs on `prepack`, so the
 * published tarball always ships a fully-resolved snapshot.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = path.resolve(pkgRoot, '..');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf-8'));

/** name -> version for every sibling workspace package. */
function collectWorkspaceVersions() {
  const versions = {};
  for (const dir of fs.readdirSync(packagesDir)) {
    const pkgJsonPath = path.join(packagesDir, dir, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) continue;
    const { name, version } = readJson(pkgJsonPath);
    if (name && version) versions[name] = version;
  }
  return versions;
}

const { devDependencies = {} } = readJson(path.join(pkgRoot, 'package.json'));
const workspaceVersions = collectWorkspaceVersions();

const resolved = {};
for (const [name, spec] of Object.entries(devDependencies)) {
  if (spec.startsWith('workspace:')) {
    const version = workspaceVersions[name];
    if (!version) {
      throw new Error(
        `Cannot resolve "${name}": "${spec}" — no workspace package with that name was found. ` +
          'Scaffolded apps must not contain the workspace: protocol.',
      );
    }
    resolved[name] = `^${version}`;
  } else {
    resolved[name] = spec;
  }
}

const distDir = path.join(pkgRoot, 'dist');
fs.mkdirSync(distDir, { recursive: true });
const outFile = path.join(distDir, 'versions.json');
fs.writeFileSync(outFile, `${JSON.stringify(resolved, null, 2)}\n`);
console.log(`[create-vue-lynx] wrote ${path.relative(pkgRoot, outFile)}`);
