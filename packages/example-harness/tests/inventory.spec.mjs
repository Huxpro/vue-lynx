import { describe, expect, test } from "vitest";

import {
  compareInventory,
  discoverInventory,
  loadManifest,
} from "../src/inventory.mjs";

const root = new URL("../../..", import.meta.url);

describe("example inventory", () => {
  test("accounts for all 29 example directories and 48 configured entries", async () => {
    const inventory = await discoverInventory(root);
    const counts = Object.fromEntries(
      inventory.directories.map(({ directory, entries }) => [
        directory,
        entries.length,
      ])
    );

    expect(inventory.directories).toHaveLength(29);
    expect(inventory.entries).toHaveLength(48);
    expect(counts).toMatchObject({
      "7guis": 7,
      basic: 2,
      gallery: 7,
      "main-thread": 5,
      swiper: 3,
    });
  });

  test("matches the checked-in manifest in both directions", async () => {
    const inventory = await discoverInventory(root);
    const manifest = await loadManifest(root);

    expect(compareInventory(inventory, manifest)).toEqual({
      missing: [],
      extra: [],
      mismatched: [],
    });
  });

  test("reports duplicate manifest rows", async () => {
    const inventory = await discoverInventory(root);
    const manifest = await loadManifest(root);
    const duplicated = {
      ...manifest,
      entries: [...manifest.entries, manifest.entries[0]],
    };

    expect(() => compareInventory(inventory, duplicated)).toThrow(/duplicate/i);
  });
});
