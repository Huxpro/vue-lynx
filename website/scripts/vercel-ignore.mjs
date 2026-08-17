#!/usr/bin/env node
/**
 * Vercel Ignored Build Step for the docs site.
 *
 * Exit 0 to skip a deployment, exit 1 to build.  The site renders generated
 * API docs from packages/* and copies example source/bundles from examples/*,
 * so changes in those paths should still trigger a build.  Changes outside of
 * docs inputs (for example CI-only files) can safely avoid spending a Vercel
 * build minute.
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(websiteRoot, '..');

const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA;
const currentSha = process.env.VERCEL_GIT_COMMIT_SHA || 'HEAD';

const watchedPaths = [
  'website',
  'examples',
  'packages',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.json',
];

function build(reason) {
  console.info(`Vercel build required: ${reason}`);
  process.exit(1);
}

function skip(reason) {
  console.info(`Skipping Vercel build: ${reason}`);
  process.exit(0);
}

if (!previousSha) {
  build('VERCEL_GIT_PREVIOUS_SHA is unavailable');
}

if (/^0+$/.test(previousSha)) {
  build('initial deployment has no previous commit to diff against');
}

try {
  execFileSync(
    'git',
    ['diff', '--quiet', previousSha, currentSha, '--', ...watchedPaths],
    { cwd: repoRoot, stdio: 'ignore' },
  );
  skip('no docs, package, or example inputs changed');
} catch (error) {
  if (error && typeof error === 'object' && 'status' in error) {
    if (error.status === 1) {
      build('docs, package, or example inputs changed');
    }
    build(`git diff failed with status ${error.status}`);
  }
  build('git diff failed');
}
