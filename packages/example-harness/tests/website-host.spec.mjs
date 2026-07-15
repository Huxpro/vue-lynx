import { readFile } from "node:fs/promises";

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

  test("exposes a shared entry-aware VDOM/Vapor control", async () => {
    const source = await readFile(
      new URL("../../../website/src/components/go/Go.tsx", import.meta.url),
      "utf8",
    );
    const storeSource = await readFile(
      new URL(
        "../../../website/src/components/go/render-mode-store.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const navControlSource = await readFile(
      new URL(
        "../../../website/src/components/go/GoModeNavIndicator.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    const configSource = await readFile(
      new URL("../../../website/rspress.config.ts", import.meta.url),
      "utf8",
    );
    const themeSource = await readFile(
      new URL("../../../website/theme/index.tsx", import.meta.url),
      "utf8",
    );
    const modeStyles = await readFile(
      new URL(
        "../../../website/src/components/go/vapor-status.scss",
        import.meta.url,
      ),
      "utf8",
    );
    const goWebPatch = await readFile(
      new URL(
        "../../../patches/@lynx-js__go-web@0.6.0.patch",
        import.meta.url,
      ),
      "utf8",
    );
    const webCorePatch = await readFile(
      new URL(
        "../../../patches/@lynx-js__web-core@0.22.1.patch",
        import.meta.url,
      ),
      "utf8",
    ).catch(() => "");
    const rootPackage = await readFile(
      new URL("../../../package.json", import.meta.url),
      "utf8",
    );

    expect(source).toContain("onEntryChange={handleEntryChange}");
    expect(source).toContain("metadataForMode(metadata, mode)");
    expect(source).toContain("exampleMetadata={renderedMetadata}");
    expect(source).not.toContain("<SWRConfig");
    expect(source).toContain("useSyncExternalStore(");
    // Every mode handle (nav switch, per-example badge, ModeTabs) must drive
    // the one shared store — never a component-local copy of the state.
    expect(source).not.toContain("createRenderModeStore(");
    expect(navControlSource).toContain("renderModeStore.setMode(");
    expect(configSource).not.toContain("remarkGoModeToolbar");
    expect(configSource).not.toContain("GoModeToolbar.tsx");
    expect(themeSource).toContain("<GoModeNavIndicator");
    expect(themeSource).toContain("beforeNavMenu={");
    expect(modeStyles).not.toContain(".go-mode-toolbar");
    // go-web ≥0.5 ships key={src} upstream; the patch carries the metadata
    // preload + entry-change callback the mode store depends on.
    expect(goWebPatch).toContain("exampleMetadata ?? fetchedExampleData");
    expect(goWebPatch).toContain("onEntryChange?.(entryName)");
    expect(webCorePatch).toContain("callDestroyLifetimeFun is not a function");
    expect(rootPackage).toContain('"@lynx-js/web-core@0.22.1"');
    expect(storeSource).toContain("browser.history.replaceState(");
    expect(storeSource).not.toContain("location.assign(");
    expect(source).toContain('aria-busy="true"');
    expect(source).toContain("<VaporStatus");
  });
});
