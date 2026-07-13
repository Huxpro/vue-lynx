import { describe, expect, test, vi } from "vitest";

import {
  createTemplateLoader,
  mountExampleView,
} from "../../../website/src/components/example-harness/runtime.ts";

describe("Lynx-for-Web example host", () => {
  test("mounts exactly one ready lynx-view for a bundle", () => {
    const view = {
      setAttribute: vi.fn(),
      shadowRoot: { childNodes: [{}] },
    };
    const document = {
      createElement: vi.fn(() => view),
    };
    const host = {
      innerHTML: "stale",
      appendChild: vi.fn(),
      getBoundingClientRect: () => ({ width: 320, height: 640 }),
    };
    const globalObject = { devicePixelRatio: 2 };

    mountExampleView({
      bundle: "/examples/basic/dist/main.web.bundle",
      document,
      globalObject,
      host,
      schedule: (callback) => callback(),
    });

    expect(document.createElement).toHaveBeenCalledOnce();
    expect(document.createElement).toHaveBeenCalledWith("lynx-view");
    expect(host.appendChild).toHaveBeenCalledWith(view);
    expect(view.url).toBe("/examples/basic/dist/main.web.bundle");
    expect(view.browserConfig).toEqual({ pixelWidth: 640, pixelHeight: 1280 });
    expect(view.customTemplateLoader).toBeTypeOf("function");
    expect(globalObject.__VUE_LYNX_EXAMPLE_HARNESS__).toEqual({
      status: "ready",
      bundle: "/examples/basic/dist/main.web.bundle",
      error: "",
    });
  });

  test("rewrites webpack public path and shims a missing runtime", async () => {
    const fetch = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({ lepusCode: { root: "__webpack_require__.p" } }),
    }));
    const loader = createTemplateLoader(fetch);

    const template = await loader(
      "http://localhost/examples/basic/dist/main.web.bundle",
    );

    expect(template.lepusCode.root).toContain("var __webpack_require__=");
    expect(template.lepusCode.root).toContain(
      "http://localhost/examples/basic/dist/",
    );
  });
});
