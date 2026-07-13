import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import {
  copyOverlayFile,
  generateVaporOverlay,
  transformModule,
  transformSFC,
} from "../src/vapor-overlay.mjs";

const root = new URL("../../..", import.meta.url);

describe("Vapor overlay transforms", () => {
  test("marks script setup SFCs as Vapor without changing attributes", () => {
    expect(
      transformSFC('<script setup lang="ts">\nconst n = 1\n</script>')
    ).toContain('<script setup vapor lang="ts">');
  });

  test("rewrites exact Vue Lynx runtime imports", () => {
    expect(transformModule("import { ref } from 'vue-lynx'\n")).toContain(
      "from 'vue-lynx/vapor-app'"
    );
  });

  test("rejects Options API SFCs", () => {
    expect(() => transformSFC("<script>export default {}</script>")).toThrow(
      /Options API/
    );
  });

  test("copies binary assets byte-for-byte", async () => {
    const directory = await mkdtemp(join(tmpdir(), "vue-lynx-vapor-"));
    const source = join(directory, "source.png");
    const destination = join(directory, "nested", "destination.png");
    const bytes = Buffer.from([0, 255, 18, 52, 128]);
    await writeFile(source, bytes);

    await copyOverlayFile(source, destination);

    expect(await readFile(destination)).toEqual(bytes);
  });

  test("creates an isolated Vapor source tree and generated config", async () => {
    const result = await generateVaporOverlay(root, "basic");

    expect(await readFile(result.configPath, "utf8")).toMatch(/dist-vapor/);
    expect(await readFile(result.configPath, "utf8")).toMatch(/vapor:\s*true/);
    expect(await readFile(result.configPath, "utf8")).not.toMatch(/h-counter/);
    expect(
      await readFile(
        new URL("examples/basic/.vapor-generated/src/App.vue", root),
        "utf8"
      )
    ).toContain("<script setup vapor");
  });
});
