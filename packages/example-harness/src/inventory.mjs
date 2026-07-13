import { readdir, readFile } from "node:fs/promises";

import { loadManifest } from "./manifest.mjs";

function extractObject(source, property) {
  const start = source.search(new RegExp(`\\b${property}\\s*:\\s*\\{`));
  if (start === -1) {
    throw new Error(`Could not find ${property} object`);
  }

  const opening = source.indexOf("{", start);
  let depth = 0;
  for (let index = opening; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(opening + 1, index);
  }

  throw new Error(`Unclosed ${property} object`);
}

export function parseEntries(source, configPath = "lynx.config.ts") {
  const sourceBlock = extractObject(source, "source");
  const entryBlock = extractObject(sourceBlock, "entry");
  const rows = [];
  const pattern =
    /(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$-]*))\s*:\s*['"]([^'"]+)['"]\s*,?/g;

  for (const match of entryBlock.matchAll(pattern)) {
    rows.push({ name: match[1] ?? match[2] ?? match[3], entry: match[4] });
  }

  if (rows.length === 0) {
    throw new Error(`No entries found in ${configPath}`);
  }

  return rows;
}

export async function discoverInventory(root) {
  const examplesUrl = new URL("examples/", root);
  const children = await readdir(examplesUrl, { withFileTypes: true });
  const directories = [];

  for (const child of children.filter((item) => item.isDirectory())) {
    const configUrl = new URL(`${child.name}/lynx.config.ts`, examplesUrl);
    let source;
    try {
      source = await readFile(configUrl, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }

    const entries = parseEntries(source, configUrl.pathname)
      .map(({ name, entry }) => ({ id: `${child.name}/${name}`, entry }))
      .sort((left, right) => left.id.localeCompare(right.id));
    directories.push({ directory: child.name, entries });
  }

  directories.sort((left, right) =>
    left.directory.localeCompare(right.directory)
  );
  return {
    directories,
    entries: directories.flatMap(({ entries }) => entries),
  };
}

export function compareInventory(inventory, manifest) {
  const ids = manifest.entries.map(({ id }) => id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate manifest IDs: ${[...new Set(duplicates)].join(", ")}`
    );
  }

  const actual = new Map(inventory.entries.map((row) => [row.id, row.entry]));
  const expected = new Map(manifest.entries.map((row) => [row.id, row.entry]));

  return {
    missing: inventory.entries
      .filter(({ id }) => !expected.has(id))
      .map(({ id }) => id),
    extra: manifest.entries
      .filter(({ id }) => !actual.has(id))
      .map(({ id }) => id),
    mismatched: manifest.entries
      .filter(({ id, entry }) => actual.has(id) && actual.get(id) !== entry)
      .map(({ id, entry }) => ({
        id,
        actual: actual.get(id),
        expected: entry,
      })),
  };
}

export { loadManifest };
