import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { discoverInventory } from "./inventory.mjs";
import { loadManifest } from "./manifest.mjs";
import { scenarios } from "./scenarios.mjs";
import { buildSourceGraph } from "./source-graph.mjs";

export async function computeEntrySourceHash(root, row) {
  const [example] = row.id.split("/");
  const inputs = [row.entry, row.vapor.vaporEntry].filter(Boolean);
  const hash = createHash("sha256");

  for (const entry of [...new Set(inputs)].sort()) {
    const path = join("examples", example, entry.replace(/^\.\//, ""));
    const graph = await buildSourceGraph(root, path);
    hash.update(path);
    hash.update("\0");
    hash.update(graph.hash);
    hash.update("\0");
  }

  const rootPath = fileURLToPath(root);
  for (const path of [
    join(rootPath, "examples", example, "lynx.config.ts"),
    join(rootPath, "examples", example, "package.json"),
  ]) {
    hash.update(await readFile(path));
    hash.update("\0");
  }
  hash.update(JSON.stringify(scenarios[row.scenario]));
  return hash.digest("hex");
}

export function validateStatusRecords(entries, currentHashes) {
  const errors = [];
  for (const row of entries) {
    const disposition = row.vapor?.disposition;
    if (!new Set(["supported", "unsupported"]).has(disposition)) {
      errors.push(`${row.id}: unresolved Vapor disposition ${disposition}`);
    }
    if (row.verification?.vdomWeb !== "passed") {
      errors.push(`${row.id}: missing passing VDOM Web result`);
    }
    if (disposition === "supported" && row.verification?.vaporWeb !== "passed") {
      errors.push(`${row.id}: missing passing Vapor Web result`);
    }
    if (disposition === "supported" && row.verification?.parity !== "passed") {
      errors.push(`${row.id}: missing passing parity result`);
    }
    if (disposition === "unsupported" && !row.vapor.reasonCode) {
      errors.push(`${row.id}: unsupported entry has no reasonCode`);
    }
    if (row.verification?.sourceHash !== currentHashes.get(row.id)) {
      errors.push(`${row.id}: source hash is stale`);
    }
  }
  return errors;
}

export async function finalizeManifest(root, manifest, results) {
  const byKey = new Map(results.map((result) => [`${result.mode}:${result.id}`, result]));
  const entries = [];

  for (const row of manifest.entries) {
    const vdom = byKey.get(`vdom:${row.id}`);
    const vapor = byKey.get(`vapor:${row.id}`);
    if (!vdom?.ok) throw new Error(`${row.id}: VDOM Web verification did not pass`);
    if (row.vapor.disposition !== "unsupported" && !vapor?.ok) {
      throw new Error(`${row.id}: Vapor Web verification did not pass`);
    }

    const wasAdapter = row.vapor.disposition === "adapter" || row.vapor.strategy === "adapter";
    const vaporStatus = row.vapor.disposition === "unsupported"
      ? row.vapor
      : {
          ...row.vapor,
          disposition: "supported",
          strategy: wasAdapter ? "adapter" : "direct",
        };
    entries.push({
      ...row,
      vapor: vaporStatus,
      verification: {
        sourceHash: await computeEntrySourceHash(root, row),
        vdomWeb: "passed",
        vaporWeb: vaporStatus.disposition === "supported" ? "passed" : "unsupported",
        parity: vaporStatus.disposition === "supported" ? "passed" : "not-applicable",
      },
    });
  }

  const supported = entries.filter(({ vapor }) => vapor.disposition === "supported").length;
  return {
    ...manifest,
    entries,
    results: {
      environment: "lynx-for-web/chromium",
      entries: entries.length,
      supported,
      unsupported: entries.length - supported,
      vdomPassed: entries.length,
      vaporPassed: supported,
    },
  };
}

export async function validateManifestStatus(root, manifest) {
  const hashes = new Map();
  for (const row of manifest.entries) {
    hashes.set(row.id, await computeEntrySourceHash(root, row));
  }
  return validateStatusRecords(manifest.entries, hashes);
}

async function main() {
  const root = new URL("../../..", import.meta.url);
  let manifest = await loadManifest(root);
  if (process.argv.includes("--update")) {
    const resultPath = join(
      fileURLToPath(root),
      "artifacts",
      "example-harness",
      "web-all.json",
    );
    const results = JSON.parse(await readFile(resultPath, "utf8"));
    manifest = await finalizeManifest(root, manifest, results);
    await writeFile(
      join(fileURLToPath(root), "examples", "vapor-support.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }

  const errors = await validateManifestStatus(root, manifest);
  // The manifest must cover exactly the discovered example inventory — the
  // count is derived, not hard-coded, so new examples fail loudly here
  // until they are verified rather than silently skewing the matrix.
  const inventory = await discoverInventory(root);
  const expected = inventory.entries.length;
  if (manifest.entries.length !== expected) {
    errors.push(
      `expected ${expected} entries (discovered inventory), got ${manifest.entries.length}`,
    );
  }
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.info(
      `Vapor example status: ${manifest.results.supported} supported, ${manifest.results.unsupported} unsupported; ${expected}/${expected} VDOM Web passed`,
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
