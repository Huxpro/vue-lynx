import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceExtensions = [
  "",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".vue",
  ".json",
];
const importPattern = /(?:from\s*|import\s*\(|import\s*)['"]([^'"]+)['"]/g;

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolveImport(importer, specifier) {
  if (!specifier.startsWith(".")) return null;
  const requested = resolve(dirname(importer), specifier);
  const candidates = [];

  if (extname(requested) === ".js") {
    candidates.push(
      requested.slice(0, -3) + ".ts",
      requested.slice(0, -3) + ".tsx"
    );
  }
  candidates.push(
    ...sourceExtensions.map((extension) => requested + extension)
  );
  candidates.push(
    ...sourceExtensions
      .slice(1)
      .map((extension) => resolve(requested, `index${extension}`))
  );

  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}

export function detectUnsupportedFeatures(source, file) {
  const checks = [
    ["render-function", /\bh\s*\(/],
    ["options-api", /export\s+default\s+(?:defineComponent\s*\()?\s*\{/],
    ["keep-alive", /\bKeepAlive\b|<KeepAlive\b/],
    ["suspense", /\bSuspense\b|<Suspense\b/],
    ["transition", /\bTransition(?:Group)?\b|<Transition(?:Group)?\b/],
    ["teleport", /\bTeleport\b|<Teleport\b/],
    ["v-html", /\bv-html\s*=/],
    ["vue-router", /from\s+['"]vue-router['"]/],
    ["current-instance", /\bgetCurrentInstance\s*\(/],
    ["global-properties", /app\.config\.globalProperties/],
  ];

  return checks
    .filter(([, pattern]) => pattern.test(source))
    .map(([reasonCode]) => ({ reasonCode, evidence: file }));
}

export async function buildSourceGraph(root, entry) {
  const rootPath = fileURLToPath(root);
  const queue = [resolve(rootPath, entry)];
  const visited = new Map();

  while (queue.length > 0) {
    const file = queue.shift();
    if (visited.has(file)) continue;
    const bytes = await readFile(file);
    visited.set(file, bytes);

    if (
      ![".ts", ".tsx", ".js", ".jsx", ".mjs", ".vue"].includes(extname(file))
    ) {
      continue;
    }

    const source = bytes.toString("utf8");
    for (const match of source.matchAll(importPattern)) {
      const dependency = await resolveImport(file, match[1]);
      if (dependency && !visited.has(dependency)) queue.push(dependency);
    }
  }

  const rows = [...visited.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  );
  const hash = createHash("sha256");
  for (const [file, bytes] of rows) {
    hash.update(relative(rootPath, file));
    hash.update("\0");
    hash.update(bytes);
    hash.update("\0");
  }

  return {
    files: rows.map(([file]) => relative(rootPath, file)),
    hash: hash.digest("hex"),
    unsupported: rows.flatMap(([file, bytes]) =>
      detectUnsupportedFeatures(
        bytes.toString("utf8"),
        relative(rootPath, file)
      )
    ),
  };
}
