#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = join(rootDir, 'examples');
const dryRun = process.argv.includes('--dry-run');

const packages = readdirSync(examplesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const packagePath = join(examplesDir, entry.name, 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

    return {
      dir: entry.name,
      name: packageJson.name,
      private: packageJson.private === true,
    };
  })
  .filter((pkg) => !pkg.private && pkg.name?.startsWith('@vue-lynx-example/'))
  .sort((a, b) => a.name.localeCompare(b.name));

if (packages.length === 0) {
  console.error('No publishable Vue Lynx example packages found.');
  process.exit(1);
}

if (dryRun) {
  for (const pkg of packages) {
    console.info(`${pkg.name} (${pkg.dir})`);
  }
  process.exit(0);
}

const filterArgs = packages.flatMap((pkg) => ['--filter', pkg.name]);
const result = spawnSync('pnpm', [...filterArgs, '--parallel', 'run', 'build'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
