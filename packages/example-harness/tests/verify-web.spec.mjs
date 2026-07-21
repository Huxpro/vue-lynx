import { describe, expect, test } from "vitest";

import {
  applyVisualComparison,
  isActionableRequestFailure,
  localExampleAssetUrl,
  selectAllShortcut,
  visualArtifactPaths,
} from "../src/verify-web.mjs";

describe("web verification network failures", () => {
  test("ignores browser-cancelled duplicate requests but keeps real failures", () => {
    expect(isActionableRequestFailure("net::ERR_ABORTED")).toBe(false);
    expect(isActionableRequestFailure("net::ERR_FAILED")).toBe(true);
  });

  test("uses the platform select-all shortcut", () => {
    expect(selectAllShortcut("darwin")).toBe("Meta+A");
    expect(selectAllShortcut("linux")).toBe("Control+A");
    expect(selectAllShortcut("win32")).toBe("Control+A");
  });

  test("serves production-prefixed example assets from the local harness", () => {
    expect(
      localExampleAssetUrl(
        "http://127.0.0.1:4173",
        "https://vue.lynxjs.org/examples/gallery/dist-vapor/static/image/card.png",
      ),
    ).toBe(
      "http://127.0.0.1:4173/examples/gallery/dist-vapor/static/image/card.png",
    );
    expect(
      localExampleAssetUrl("http://127.0.0.1:4173", "https://example.test/card.png"),
    ).toBeNull();
  });
});

describe("web visual parity reporting", () => {
  test("uses deterministic paired artifact names", () => {
    expect(visualArtifactPaths("/tmp/artifacts", "reactivity/main")).toEqual({
      directory: "/tmp/artifacts/visual",
      vdom: "/tmp/artifacts/visual/reactivity__main__vdom.png",
      vapor: "/tmp/artifacts/visual/reactivity__main__vapor.png",
      diff: "/tmp/artifacts/visual/reactivity__main__diff.png",
    });
  });

  test("fails a functionally passing Vapor result on visual mismatch", () => {
    const vdom = { id: "reactivity/main", mode: "vdom", ok: true };
    const vapor = { id: "reactivity/main", mode: "vapor", ok: true };
    const paths = visualArtifactPaths("/tmp/artifacts", vdom.id);

    applyVisualComparison(vdom, vapor, {
      matches: false,
      diffPixels: 4200,
      diffRatio: 0.0128,
      totalPixels: 329160,
      width: 390,
      height: 844,
    }, paths);

    expect(vdom.ok).toBe(true);
    expect(vapor.ok).toBe(false);
    expect(vapor.error).toContain("Visual parity mismatch");
    expect(vapor.visualParity).toEqual({
      status: "failed",
      diffPixels: 4200,
      diffRatio: 0.0128,
      totalPixels: 329160,
      width: 390,
      height: 844,
      artifacts: {
        vdom: paths.vdom,
        vapor: paths.vapor,
        diff: paths.diff,
      },
    });
  });
});
