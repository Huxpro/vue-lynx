import { describe, expect, test } from "vitest";

import { loadManifest } from "../src/manifest.mjs";
import { scenarios } from "../src/scenarios.mjs";

const root = new URL("../../..", import.meta.url);

describe("browser scenario coverage", () => {
  test("defines exactly one scenario for every configured entry", async () => {
    const manifest = await loadManifest(root);
    const expected = manifest.entries.map(({ scenario }) => scenario).sort();

    // The bijection with the manifest is the invariant; the count follows
    // from it (and from the inventory check in inventory.spec.mjs).
    expect(Object.keys(scenarios).sort()).toEqual(expected);
    expect(Object.keys(scenarios)).toHaveLength(expected.length);
  });

  test("every scenario has a visible assertion and interactive rows have an action", () => {
    for (const [id, scenario] of Object.entries(scenarios)) {
      expect(scenario.assertions.length, `${id} assertions`).toBeGreaterThan(0);
      if (scenario.interactive) {
        expect(scenario.actions.length, `${id} actions`).toBeGreaterThan(0);
      }
      expect(JSON.stringify(scenario)).not.toMatch(/waitForTimeout|sleep/i);
    }
  });
});
