import { readFile } from "node:fs/promises";

export async function loadManifest(root) {
  const path = new URL("examples/vapor-support.json", root);
  const manifest = JSON.parse(await readFile(path, "utf8"));

  if (manifest.version !== 1 || !Array.isArray(manifest.entries)) {
    throw new Error("Invalid Vapor support manifest");
  }

  return manifest;
}
