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
import { gzipSync } from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const EXAMPLES_SRC = path.resolve(REPO_ROOT, 'examples');
const EXAMPLES_DEST = path.resolve(__dirname, '../docs/public/examples');
const EXAMPLE_GIT_BASE_URL = 'https://github.com/huxpro/vue-lynx/tree/main/examples';
// The support matrix is produced by the example-harness verification run.
// Its absence must degrade to "all examples VDOM-only", not break the docs
// build — this script also runs on checkouts that never ran the harness.
function loadVaporSupport() {
  const file = path.join(EXAMPLES_SRC, 'vapor-support.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    console.warn(
      `⚠ Could not read ${file} (${err.message}); marking all examples VDOM-only.`,
    );
    return { version: 1, entries: [] };
  }
}
const vaporSupport = loadVaporSupport();
const vaporById = new Map(vaporSupport.entries.map((entry) => [entry.id, entry.vapor]));

const PLUGIN_DIST = path.join(
  REPO_ROOT,
  'packages/vue-lynx/plugin/dist/index.js',
);

// On Vercel, pre-gzip *.lynx.bundle so QR/device fetches stay under LynxExplorer's
// ~10s timeout. IFR roughly doubled uncompressed size; Vercel only auto-compresses
// when the client sends Accept-Encoding, and some native fetchers do not.
// vercel.json sets Content-Encoding: gzip for these paths.
const PRE_GZIP_LYNX_BUNDLES = Boolean(process.env.VERCEL);

// File extensions to skip (binary assets in src/)
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.svg',
  '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm',
  '.ttf', '.woff', '.woff2', '.eot', '.otf',
  '.zip', '.tar', '.tgz', '.gz', '.rar',
  '.pdf', '.psd', '.tif',
]);

// Directories to skip
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-vapor',
  '.vapor-generated',
  '.cache',
  '.git',
  '.data',
  '.rspeedy',
]);

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
    const vapor = vaporById.get(`${exampleName}/${name}`);
    const entry = {
      name,
      file: `dist/${name}.lynx.bundle`,
      // Anything but a verified 'supported' (including entries missing from
      // the matrix) renders as VDOM — the UI types only these two states.
      vaporStatus: vapor?.disposition === 'supported' ? 'supported' : 'unsupported',
      vaporReason: vapor?.reasonCode,
    };
    // Check if web bundle exists (rspeedy produces .web.bundle)
    const webBundlePath = path.join(srcDir, `dist/${name}.web.bundle`);
    if (fs.existsSync(webBundlePath)) {
      entry.webFile = `dist/${name}.web.bundle`;
    }
    const vaporBundlePath = path.join(srcDir, `dist-vapor/${name}.lynx.bundle`);
    const vaporWebBundlePath = path.join(srcDir, `dist-vapor/${name}.web.bundle`);
    if (fs.existsSync(vaporBundlePath)) entry.vaporFile = `dist-vapor/${name}.lynx.bundle`;
    if (fs.existsSync(vaporWebBundlePath)) entry.vaporWebFile = `dist-vapor/${name}.web.bundle`;
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
  const distDestDir = path.join(destDir, 'dist');
  if (fs.existsSync(distSrcDir)) {
    copyDirRecursive(distSrcDir, distDestDir);
    if (PRE_GZIP_LYNX_BUNDLES) {
      gzipLynxBundlesInPlace(distDestDir);
    }
  }
  const vaporDistSrcDir = path.join(srcDir, 'dist-vapor');
  if (fs.existsSync(vaporDistSrcDir)) {
    copyDirRecursive(vaporDistSrcDir, path.join(destDir, 'dist-vapor'));
  }

  // Copy preview image if it exists
  if (previewImage) {
    const srcFile = path.join(srcDir, previewImage);
    const destFile = path.join(destDir, previewImage);
    fs.copyFileSync(srcFile, destFile);
  }

  console.info(`  -> ${textFiles.length} files, ${templateFiles.length} entries`);
}

/**
 * Replace each *.lynx.bundle with its gzip payload (same filename).
 * Paired with vercel.json Content-Encoding: gzip so HTTP clients inflate.
 */
function gzipLynxBundlesInPlace(dir) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      gzipLynxBundlesInPlace(fullPath);
      continue;
    }
    if (!entry.name.endsWith('.lynx.bundle')) continue;

    const raw = fs.readFileSync(fullPath);
    // Already gzipped (magic 1f 8b) — leave as-is so re-runs are idempotent.
    if (raw.length >= 2 && raw[0] === 0x1f && raw[1] === 0x8b) continue;

    const compressed = gzipSync(raw, { level: 9 });
    fs.writeFileSync(fullPath, compressed);
    const ratio = raw.length === 0 ? 0 : compressed.length / raw.length;
    console.info(
      `  gzip ${entry.name}: ${raw.length} -> ${compressed.length} bytes (${(ratio * 100).toFixed(1)}%)`,
    );
  }
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

// Examples with at least one Vapor-supported entry also need dist-vapor/
// (built via the example-harness overlay). Without this, fresh checkouts —
// including CI/Vercel, where dist* are gitignored — would ship a VDOM/Vapor
// switch whose Vapor side silently falls back everywhere.
const vaporExamples = [...new Set(
  vaporSupport.entries
    .filter((entry) => entry.vapor?.disposition === 'supported')
    .map((entry) => entry.id.split('/')[0]),
)].filter((example) => examples.includes(example));
const needsVaporBuild = vaporExamples.some((example) =>
  !fs.existsSync(path.join(EXAMPLES_SRC, example, 'dist-vapor')),
);

if (needsBuild || needsVaporBuild) {
  // Examples depend on vue-lynx (workspace:*), so build the lib first if needed
  const libBuilt = fs.existsSync(PLUGIN_DIST);
  if (!libBuilt) {
    console.info('Building vue-lynx library (required by examples)...');
    execSync('pnpm build', { cwd: REPO_ROOT, stdio: 'inherit' });
  }

  for (const example of examples) {
    const exampleDir = path.join(EXAMPLES_SRC, example);
    const distDir = path.join(exampleDir, 'dist');
    if (needsBuild && !fs.existsSync(distDir)) {
      console.info(`Building example: ${example} (no dist/ found)`);
      try {
        execSync('pnpm build', { cwd: exampleDir, stdio: 'inherit' });
      } catch (err) {
        console.error(`  ⚠ Failed to build ${example}:`, err.message);
      }
    }
    if (vaporExamples.includes(example)
      && !fs.existsSync(path.join(exampleDir, 'dist-vapor'))) {
      console.info(`Building example: ${example} (no dist-vapor/ found)`);
      try {
        execSync(
          `node packages/example-harness/src/build-vapor.mjs --example ${example}`,
          { cwd: REPO_ROOT, stdio: 'inherit' },
        );
      } catch (err) {
        // Degrades cleanly: the entry keeps vaporStatus but has no vapor
        // bundles, so resolveRenderMode falls back to VDOM for it.
        console.error(`  ⚠ Failed to build ${example} (vapor):`, err.message);
      }
    }
  }
}

// Process each example
for (const example of examples) {
  processExample(example);
}

fs.writeFileSync(
  path.join(EXAMPLES_DEST, 'vapor-support.json'),
  `${JSON.stringify(vaporSupport, null, 2)}\n`,
);

console.info(`\nDone! Processed ${examples.length} examples.`);
