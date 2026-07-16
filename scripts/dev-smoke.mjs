import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const cwd = process.cwd();
const exampleDir = path.join(cwd, 'examples/basic');
const cacheDir = path.join(exampleDir, 'node_modules/.cache');
const mainThreadBundle = path.join(
  exampleDir,
  'dist/.rspeedy/main/main-thread.js',
);
const timeoutMs = 180_000;

const stripAnsi = (text) => text.replace(
  /\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g,
  '',
);

const isPnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const successPatterns = {
  web: /ready\s+built in .*?\(web\)/i,
  lynx: /ready\s+built in .*?\(lynx\)/i,
};
const failurePatterns = [
  /Build errors:/i,
  /Module not found:/i,
  /error\s+build failed/i,
  /ELIFECYCLE/i,
];

let child;
let timedOut = false;
let resolved = false;
let verifying = false;
let sawWebReady = false;
let sawLynxReady = false;
let output = '';

function appendOutput(chunk) {
  if (resolved) return;
  const text = stripAnsi(String(chunk));
  output += text;
  if (output.length > 40_000) {
    output = output.slice(-40_000);
  }
  process.stdout.write(chunk);
  sawWebReady ||= successPatterns.web.test(text);
  sawLynxReady ||= successPatterns.lynx.test(text);
}

function stopChild(signal = 'SIGTERM') {
  if (!child || child.killed) return;
  if (process.platform === 'win32') {
    child.kill(signal);
    return;
  }
  try {
    process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}

function fail(message) {
  if (resolved) return;
  resolved = true;
  stopChild('SIGTERM');
  console.error(`\n[dev-smoke] ${message}`);
  if (output.trim()) {
    console.error('\n[dev-smoke] Recent output:\n');
    console.error(output.trimEnd());
  }
  process.exitCode = 1;
}

async function succeed() {
  if (resolved || verifying) return;
  verifying = true;

  try {
    const source = await fs.readFile(mainThreadBundle, 'utf8');
    if (
      !source.includes("g['renderPage'] = function")
      || !source.includes("__CreatePage('0', 0)")
    ) {
      fail(
        'The Lynx main-thread bundle is missing the Vue bootstrap '
          + '(renderPage/__CreatePage).',
      );
      return;
    }
  } catch (error) {
    fail(`Could not inspect the Lynx main-thread bundle: ${error}`);
    return;
  }

  resolved = true;
  stopChild('SIGTERM');
  console.info(
    '\n[dev-smoke] examples/basic built for web and lynx with the Vue main-thread bootstrap.',
  );
}

await fs.rm(cacheDir, { recursive: true, force: true });

child = spawn(isPnpmCommand, ['--dir', 'examples/basic', 'run', 'dev'], {
  cwd,
  detached: process.platform !== 'win32',
  env: {
    ...process.env,
    CI: '1',
    NO_COLOR: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

const timeout = setTimeout(() => {
  timedOut = true;
  fail(`Timed out after ${timeoutMs / 1000}s waiting for dev build readiness.`);
}, timeoutMs);

child.stdout.on('data', (chunk) => {
  appendOutput(chunk);
  if (failurePatterns.some((pattern) => pattern.test(stripAnsi(String(chunk))))) {
    fail('Detected build failure while starting examples/basic dev server.');
    return;
  }
  if (sawWebReady && sawLynxReady) {
    clearTimeout(timeout);
    void succeed();
  }
});

child.stderr.on('data', (chunk) => {
  appendOutput(chunk);
  if (failurePatterns.some((pattern) => pattern.test(stripAnsi(String(chunk))))) {
    clearTimeout(timeout);
    fail('Detected build failure on stderr while starting examples/basic dev server.');
  }
});

child.on('exit', (code, signal) => {
  clearTimeout(timeout);
  if (resolved) return;
  if (timedOut) return;
  if (sawWebReady && sawLynxReady && (code === 0 || signal === 'SIGTERM')) {
    void succeed();
    return;
  }
  fail(`examples/basic dev server exited before readiness (code: ${code}, signal: ${signal}).`);
});
