#!/usr/bin/env node

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Argv } from 'create-rstack';
import { checkCancel, create, select } from 'create-rstack';

type LANG = 'js' | 'ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const { devDependencies } = require('../package.json') as {
  devDependencies: Record<string, string>;
};

/**
 * Version map used to rewrite template dependencies (create-rstack replaces
 * each matching dependency in the template's package.json with the mapped
 * range).
 *
 * Some devDependencies use the pnpm `workspace:` protocol, which only works
 * inside this monorepo — scaffolded apps must get real semver ranges or
 * `npm install` fails with EUNSUPPORTEDPROTOCOL. `scripts/sync-versions.mjs`
 * (run on build/prepack) resolves those entries into `dist/versions.json`.
 * As a last resort, any `workspace:` spec that still slips through falls
 * back to `latest`.
 */
function loadTemplateVersions(): Record<string, string> {
  const versions: Record<string, string> = { ...devDependencies };

  try {
    Object.assign(
      versions,
      require('./versions.json') as Record<string, string>,
    );
  } catch {
    // dist/versions.json is only missing in unbuilt dev checkouts.
  }

  for (const [name, spec] of Object.entries(versions)) {
    if (spec.startsWith('workspace:')) {
      versions[name] = 'latest';
    }
  }

  return versions;
}

const TEMPLATES = [
  { template: 'vue', lang: 'ts' as LANG },
  { template: 'vue', lang: 'js' as LANG },
];

function composeTemplateName({ template, lang }: { template: string; lang: LANG }): string {
  return `${template}-${lang}`;
}

async function getTemplateName({ template }: Argv): Promise<string> {
  if (typeof template === 'string') {
    const pair = template.split('-');
    const lang = pair[pair.length - 1];
    if (lang && ['js', 'ts'].includes(lang)) {
      return template;
    }
    return `${template}-ts`;
  }

  const language = checkCancel<LANG>(
    await select({
      message: 'Select language',
      options: [
        { value: 'ts', label: 'TypeScript', hint: 'recommended' },
        { value: 'js', label: 'JavaScript' },
      ],
    }),
  );

  return composeTemplateName({ template: 'vue', lang: language });
}

void create({
  root: path.resolve(__dirname, '..'),
  name: 'vue-lynx',
  templates: TEMPLATES.map(({ template, lang }) =>
    composeTemplateName({ template, lang }),
  ),
  version: loadTemplateVersions(),
  getTemplateName,
});
