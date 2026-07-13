import {
  compareInventory,
  discoverInventory,
  loadManifest,
} from "./inventory.mjs";

const root = new URL("../../..", import.meta.url);
const inventory = await discoverInventory(root);
const manifest = await loadManifest(root);
const drift = compareInventory(inventory, manifest);

if (Object.values(drift).some((rows) => rows.length > 0)) {
  console.error(JSON.stringify(drift, null, 2));
  process.exitCode = 1;
} else {
  console.log(
    `Vapor example inventory: ${inventory.directories.length} directories, ${inventory.entries.length} entries, no drift`
  );
}
