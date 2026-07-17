import fs from 'node:fs';

const CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_PATH,
  '/opt/pw-browsers/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

export function resolveChromium() {
  const executable = CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (executable) return executable;
  throw new Error(
    'Chromium not found. Set PLAYWRIGHT_CHROMIUM_PATH to a Chromium or Chrome executable.',
  );
}
