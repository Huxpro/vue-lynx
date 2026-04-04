#!/usr/bin/env node

/**
 * Check external links in documentation files for 404s.
 * Extracts markdown links from website/docs/ and verifies each unique URL.
 *
 * Usage: node scripts/check-links.mjs
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DOCS_DIR = 'website/docs';
const LINK_RE = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
const CONCURRENCY = 5;
const TIMEOUT_MS = 10_000;

// Hosts that block automated requests (403) — skip rather than false-positive
const SKIP_HOSTS = ['npmjs.org', 'www.npmjs.com'];

async function main() {
  const files = readdirSync(DOCS_DIR, { recursive: true })
    .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
    .map(f => join(DOCS_DIR, f));
  /** @type {Map<string, string[]>} url -> list of files */
  const urlMap = new Map();

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const [, , url] of content.matchAll(LINK_RE)) {
      // Strip fragment — servers don't see it
      const clean = url.replace(/#.*$/, '');
      if (!urlMap.has(clean)) urlMap.set(clean, []);
      urlMap.get(clean).push(file);
    }
  }

  console.info(`Found ${urlMap.size} unique external URLs across ${files.length} docs\n`);

  const urls = [...urlMap.keys()].filter(url => {
    const host = new URL(url).hostname;
    return !SKIP_HOSTS.some(h => host === h || host.endsWith('.' + h));
  });
  const failures = [];

  // Check in batches
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(url => checkUrl(url)));
    for (const result of results) {
      if (!result.ok) {
        failures.push(result);
        console.info(`  FAIL ${result.status} ${result.url}`);
        for (const file of urlMap.get(result.url)) {
          console.info(`         in ${file}`);
        }
      }
    }
  }

  console.info();
  if (failures.length > 0) {
    console.info(`${failures.length} broken link(s) found.`);
    process.exit(1);
  } else {
    console.info('All links OK.');
  }
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Some servers reject HEAD, retry with GET
    if (res.status === 405 || res.status === 403) {
      const res2 = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return { url, status: res2.status, ok: res2.ok };
    }
    return { url, status: res.status, ok: res.ok };
  } catch (err) {
    return { url, status: err.message, ok: false };
  }
}

main();
