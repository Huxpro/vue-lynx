/**
 * Resolve a Chromium binary for Playwright. Cloud / local layouts differ;
 * never hardcode a single path.
 */
import { execFileSync } from 'node:child_process';

export function resolveChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  }
  const candidates = [
    'ls -d /opt/pw-browsers/chromium-*/chrome-linux64/chrome 2>/dev/null',
    'ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null',
    'ls -d /opt/pw-browsers/chromium 2>/dev/null',
    'ls -d "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux64/chrome 2>/dev/null',
    'ls -d /home/ubuntu/.cache/ms-playwright/chromium-*/chrome-linux64/chrome 2>/dev/null',
    'command -v google-chrome',
    'command -v chromium',
    'command -v chromium-browser',
  ];
  for (const cmd of candidates) {
    try {
      const found = execFileSync('bash', ['-c', cmd], { encoding: 'utf8' })
        .trim()
        .split('\n')[0];
      if (found) return found;
    } catch {
      // try next
    }
  }
  throw new Error(
    'No Chromium executable found. Set PLAYWRIGHT_CHROMIUM_PATH.',
  );
}
