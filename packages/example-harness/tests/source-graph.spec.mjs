import { describe, expect, test } from "vitest";

import {
  buildSourceGraph,
  detectUnsupportedFeatures,
} from "../src/source-graph.mjs";

const root = new URL("../../..", import.meta.url);

describe("source graph", () => {
  test("follows entry imports through TypeScript and Vue SFCs", async () => {
    const graph = await buildSourceGraph(root, "examples/basic/src/index.ts");

    expect(graph.files).toContain("examples/basic/src/App.vue");
    expect(graph.files).toContain("examples/basic/src/Counter.vue");
    expect(graph.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test("resolves .js specifiers to TypeScript sources", async () => {
    const graph = await buildSourceGraph(
      root,
      "examples/main-thread/src/shared-module/index.ts"
    );

    expect(graph.files.some((file) => file.endsWith(".ts"))).toBe(true);
  });

  test("reports static Vapor blockers with evidence", () => {
    expect(
      detectUnsupportedFeatures(
        "import { h, KeepAlive } from 'vue-lynx'; h('view')",
        "example.ts"
      )
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reasonCode: "render-function" }),
        expect.objectContaining({ reasonCode: "keep-alive" }),
      ])
    );
  });
});
