/**
 * Pre-build script that scans local examples and generates metadata + copies
 * source files to docs/public/examples/ for the <Go> component to consume.
 *
 * Replaces the lynx-website pattern of publishing @lynx-example/* npm packages.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const EXAMPLES_SRC = path.resolve(REPO_ROOT, 'examples');
const EXAMPLES_DEST = path.resolve(__dirname, '../docs/public/examples');
const EXAMPLE_GIT_BASE_URL = 'https://github.com/huxpro/vue-lynx/tree/main/examples';

// File extensions to skip (binary assets in src/)
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.svg',
  '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm',
  '.ttf', '.woff', '.woff2', '.eot', '.otf',
  '.zip', '.tar', '.tgz', '.gz', '.rar',
  '.pdf', '.psd', '.tif',
]);

// Directories to skip
const SKIP_DIRS = new Set(['node_modules', 'dist', '.cache', '.git']);

/**
 * Walk a directory recursively and collect relative file paths.
 */
function walkDir(dir, base = dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(base, fullPath);

    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, base));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

/**
 * Recursively copy a directory (no filtering).
 */
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Check if a file is a preview image at the example root.
 */
function isPreviewImage(relPath) {
  const basename = path.basename(relPath);
  return /^preview-image\.(png|jpg|jpeg|webp|gif)$/.test(basename) &&
    !relPath.includes('/');
}

/**
 * Check if a file is a text source file we should copy.
 */
function isTextFile(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) return false;
  return true;
}

/**
 * Parse lynx.config.ts to extract entry points for templateFiles.
 * Simple regex-based parser — good enough for the standard config format.
 */
function parseEntries(configPath) {
  if (!fs.existsSync(configPath)) return [];

  const content = fs.readFileSync(configPath, 'utf-8');

  // Match entry object: entry: { 'name': './path', ... }
  const entryMatch = content.match(/entry:\s*\{([^}]+)\}/s);
  if (!entryMatch) return [];

  const entries = [];
  const entryRegex = /['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = entryRegex.exec(entryMatch[1])) !== null) {
    entries.push({ name: match[1], entryPath: match[2] });
  }
  return entries;
}

/**
 * Process a single example directory.
 */
function processExample(exampleName) {
  const srcDir = path.join(EXAMPLES_SRC, exampleName);
  const destDir = path.join(EXAMPLES_DEST, exampleName);

  if (!fs.statSync(srcDir).isDirectory()) return;

  console.info(`Processing example: ${exampleName}`);

  // Collect all files
  const allFiles = walkDir(srcDir);

  // Filter to text source files (skip binary assets)
  const textFiles = allFiles.filter((f) => {
    // Always include preview images
    if (isPreviewImage(f)) return true;
    // Skip binary files
    if (!isTextFile(f)) return false;
    return true;
  });

  // Find preview image
  const previewImage = allFiles.find(isPreviewImage) || undefined;

  // Parse entries from lynx.config.ts
  const configPath = path.join(srcDir, 'lynx.config.ts');
  const entries = parseEntries(configPath);

  // Build templateFiles (pointing to expected bundle locations)
  const templateFiles = entries.map(({ name }) => {
    const entry = {
      name,
      file: `dist/${name}.lynx.bundle`,
    };
    // Check if web bundle exists (rspeedy produces .web.bundle)
    const webBundlePath = path.join(srcDir, `dist/${name}.web.bundle`);
    if (fs.existsSync(webBundlePath)) {
      entry.webFile = `dist/${name}.web.bundle`;
    }
    return entry;
  });

  // Build metadata
  const metadata = {
    name: exampleName,
    files: textFiles.filter((f) => !isPreviewImage(f)),
    templateFiles,
    previewImage: previewImage || undefined,
    exampleGitBaseUrl: EXAMPLE_GIT_BASE_URL,
  };

  // Ensure destination exists
  fs.mkdirSync(destDir, { recursive: true });

  // Write metadata
  fs.writeFileSync(
    path.join(destDir, 'example-metadata.json'),
    JSON.stringify(metadata, null, 2),
  );

  // Copy text files
  for (const relPath of textFiles) {
    const srcFile = path.join(srcDir, relPath);
    const destFile = path.join(destDir, relPath);
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    fs.copyFileSync(srcFile, destFile);
  }

  // Copy entire dist/ (bundles + static assets referenced by bundles)
  const distSrcDir = path.join(srcDir, 'dist');
  if (fs.existsSync(distSrcDir)) {
    copyDirRecursive(distSrcDir, path.join(destDir, 'dist'));
  }

  // Copy preview image if it exists
  if (previewImage) {
    const srcFile = path.join(srcDir, previewImage);
    const destFile = path.join(destDir, previewImage);
    fs.copyFileSync(srcFile, destFile);
  }

  console.info(`  -> ${textFiles.length} files, ${templateFiles.length} entries`);
}

// Main
console.info('Preparing examples...');
console.info(`Source: ${EXAMPLES_SRC}`);
console.info(`Dest:   ${EXAMPLES_DEST}`);

// Clean destination
if (fs.existsSync(EXAMPLES_DEST)) {
  fs.rmSync(EXAMPLES_DEST, { recursive: true });
}
fs.mkdirSync(EXAMPLES_DEST, { recursive: true });

// Discover example directories
const examples = fs.readdirSync(EXAMPLES_SRC, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !SKIP_DIRS.has(d.name))
  .map((d) => d.name);

// Build examples that don't have dist/ yet (e.g. on CI/Vercel where dist is gitignored)
const needsBuild = examples.some((example) =>
  !fs.existsSync(path.join(EXAMPLES_SRC, example, 'dist')),
);

if (needsBuild) {
  // Examples depend on vue-lynx (workspace:*), so build the lib first if needed
  const libBuilt = fs.existsSync(path.join(REPO_ROOT, 'plugin/dist/index.js'));
  if (!libBuilt) {
    console.info('Building vue-lynx library (required by examples)...');
    execSync('pnpm build', { cwd: REPO_ROOT, stdio: 'inherit' });
  }

  for (const example of examples) {
    const exampleDir = path.join(EXAMPLES_SRC, example);
    const distDir = path.join(exampleDir, 'dist');
    if (!fs.existsSync(distDir)) {
      console.info(`Building example: ${example} (no dist/ found)`);
      try {
        execSync('pnpm build', { cwd: exampleDir, stdio: 'inherit' });
      } catch (err) {
        console.error(`  ⚠ Failed to build ${example}:`, err.message);
      }
    }
  }
}

// Process each example
for (const example of examples) {
  processExample(example);
}

console.info(`\nDone! Processed ${examples.length} examples.`);
