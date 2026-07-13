import { access } from "node:fs/promises";

import { describe, expect, test } from "vitest";

import { buildVaporExample } from "../src/build-vapor.mjs";

const root = new URL("../../..", import.meta.url);

async function exists(url) {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

describe("Vapor example build", () => {
  test("builds supported basic entry in both environments and skips unsupported entry", async () => {
    const result = await buildVaporExample(root, "basic");

    expect(result.ok).toBe(true);
    expect(
      await exists(new URL("examples/basic/dist-vapor/main.web.bundle", root))
    ).toBe(true);
    expect(
      await exists(new URL("examples/basic/dist-vapor/main.lynx.bundle", root))
    ).toBe(true);
    expect(
      await exists(
        new URL("examples/basic/dist-vapor/h-counter.web.bundle", root)
      )
    ).toBe(false);
  }, 120_000);
});
