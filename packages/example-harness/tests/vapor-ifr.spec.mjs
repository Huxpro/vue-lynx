import { execFile } from "node:child_process";
import { readFile, rm, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import { promisify } from "node:util";

import { describe, expect, test } from "vitest";

const root = new URL("../../..", import.meta.url);
const vaporExample = new URL("examples/vapor/", root);
const generatedBundle = new URL("dist/main.web.bundle", vaporExample);
const require = createRequire(
  new URL("../../testing-library/package.json", import.meta.url),
);
const { JSDOM } = require("jsdom");
const { LynxTestingEnv } = require("@lynx-js/testing-environment");
const execFileAsync = promisify(execFile);

const VAPOR_REALM_GLOBALS = [
  "__VUE_LYNX_DOCUMENT__",
  "__VUE_LYNX_WINDOW__",
  "document",
  "window",
  "Node",
  "Element",
  "Text",
  "Comment",
  "CharacterData",
  "DocumentFragment",
  "HTMLElement",
  "SVGElement",
  "MathMLElement",
  "HTMLSlotElement",
  "ShadowRoot",
  // Rewrite targets installed by the Vapor DOM shim (see
  // VAPOR_DOM_CTOR_GLOBALS in vue-lynx/internal/ops). Each realm must
  // install its own: the shims close over that realm's ShadowElement class.
  "__VUE_LYNX_NODE__",
  "__VUE_LYNX_ELEMENT__",
  "__VUE_LYNX_TEXT__",
  "__VUE_LYNX_COMMENT__",
  "__VUE_LYNX_CHARACTER_DATA__",
  "__VUE_LYNX_DOCUMENT_FRAGMENT__",
  "__VUE_LYNX_HTML_ELEMENT__",
  "__VUE_LYNX_SVG_ELEMENT__",
  "__VUE_LYNX_MATHML_ELEMENT__",
  "__VUE_LYNX_HTML_SLOT_ELEMENT__",
  "__VUE_LYNX_HTML_STYLE_ELEMENT__",
  "__VUE_LYNX_SHADOW_ROOT__",
  "__VUE_LYNX_DOCUMENT_CTOR__",
  "__VUE_LYNX_IFR_MT__",
  "__VUE_LYNX_IFR_ENABLED__",
  "__vueLynxIfrApplyOps",
  "__vueLynxIfrMountApps",
  "__vueLynxIfrSealOps",
  "__VUE_LYNX_EVENT_REGISTRY__",
];

// Single-source protocol tables: a hand-maintained copy silently drifts
// when opcodes are renumbered (it happened with 15/16 → 16/17).
const { OP, OP_ARITY } = await import(
  new URL("../../vue-lynx/internal/dist/ops.js", import.meta.url).href
);

function captureDescriptors(names = Object.getOwnPropertyNames(globalThis)) {
  return new Map(
    names.map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ]),
  );
}

function restoreDescriptors(snapshot) {
  for (const [name, descriptor] of snapshot) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
}

function restoreHostGlobals(snapshot) {
  for (const name of Object.getOwnPropertyNames(globalThis)) {
    if (!snapshot.has(name)) {
      const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
      if (descriptor?.configurable) delete globalThis[name];
    }
  }
  restoreDescriptors(snapshot);
}

function isIfrBundle(bundle) {
  return (
    typeof bundle?.lepusCode?.root === "string" &&
    typeof bundle?.manifest?.["/app-service.js"] === "string" &&
    // `__VUE_LYNX_IFR_ENABLED__` is assigned only inside enableIFR(), which
    // only the IFR MT prelude (entry-ifr.js) pulls into the bundle. The
    // `__VUE_LYNX_IFR_MT__` *check* ships in every vapor bundle via
    // runtime/src/ifr-env.ts, so it cannot distinguish an IFR build from a
    // plain one — a plain dist/ (the committed default: enableIFR is
    // env-gated off) must be rebuilt below, not accepted as the fixture.
    bundle.lepusCode.root.includes("__VUE_LYNX_IFR_ENABLED__") &&
    // A dev-mode bundle (e.g. left in dist/ by `rspeedy dev`) keeps
    // `process.env.NODE_ENV` unreplaced and dev-only code paths alive; this
    // spec asserts the production shape, so treat such a bundle as stale and
    // rebuild it below.
    !bundle.lepusCode.root.includes("process.env.NODE_ENV")
  );
}

async function readBundle(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

/**
 * A fixture built before the library was last rebuilt embeds the OLD runtime
 * (and potentially an old ops protocol) — shape checks alone cannot see that.
 * Compare against the built library entry points the bundle embeds.
 */
async function isFixtureStale(bundleUrl) {
  const bundleTime = (await stat(bundleUrl)).mtimeMs;
  const libraryMarkers = [
    "vue-lynx/runtime/dist/vapor-app.js",
    "vue-lynx/main-thread/dist/entry-main.js",
    "vue-lynx/internal/dist/ops.js",
    "vue-lynx/plugin/dist/index.js",
  ].map((rel) => new URL(`packages/${rel}`, root));
  for (const marker of libraryMarkers) {
    try {
      if ((await stat(marker)).mtimeMs > bundleTime) return true;
    } catch {
      // A missing build output means the surrounding job will build it;
      // treat the fixture as stale so the rebuild uses fresh outputs.
      return true;
    }
  }
  return false;
}

async function loadIfrBundle() {
  const explicitPath = process.env.VUE_LYNX_VAPOR_IFR_BUNDLE;
  if (explicitPath) {
    const explicitUrl = pathToFileURL(explicitPath);
    const bundle = await readBundle(explicitUrl);
    if (!isIfrBundle(bundle)) {
      throw new Error(
        `VUE_LYNX_VAPOR_IFR_BUNDLE is not an IFR web bundle: ${explicitPath}`,
      );
    }
    return { bundle, url: explicitUrl };
  }

  try {
    const bundle = await readBundle(generatedBundle);
    if (isIfrBundle(bundle) && !(await isFixtureStale(generatedBundle))) {
      return { bundle, url: generatedBundle };
    }
  } catch {
    // Build the generated fixture below.
  }

  // Keep this test runnable from a clean checkout. The repository's runtime,
  // main-thread, and plugin packages are expected to have been built by the
  // surrounding test job, just like the existing example build tests.
  await rm(new URL("node_modules/.cache", vaporExample), {
    force: true,
    recursive: true,
  });
  await rm(new URL("dist", vaporExample), { force: true, recursive: true });
  await execFileAsync(
    fileURLToPath(new URL("node_modules/.bin/rspeedy", root)),
    ["build"],
    {
      cwd: fileURLToPath(vaporExample),
      // vitest exports NODE_ENV=test; without the explicit production
      // override, Rsbuild inherits it and emits a dev-mode bundle whose
      // devtools code calls setTimeout during MT evaluation (absent on
      // Lepus and in this spec's realm).
      env: { ...process.env, NODE_ENV: "production", VUE_LYNX_ENABLE_IFR: "1" },
    },
  );

  const bundle = await readBundle(generatedBundle);
  if (!isIfrBundle(bundle)) {
    throw new Error(
      `Generated bundle did not enable IFR: ${fileURLToPath(generatedBundle)}`,
    );
  }
  return { bundle, url: generatedBundle };
}

function normalizeHtml(html) {
  return html
    .replace(/ vue-ref-\d+="[^"]*"/g, "")
    // runtime-vapor adds its bookkeeping marker to the external page
    // container after mount. It is not part of the rendered app structure and
    // may arrive in the final BG batch rather than the first MT paint.
    .replace(/^<page class="data-v-app">/, "<page>")
    .replace(/\s+</g, "<");
}

function eventFrames(ops) {
  const events = [];
  let cursor = 0;
  while (cursor < ops.length) {
    const code = ops[cursor];
    const arity = OP_ARITY[code];
    if (arity === undefined || cursor + arity >= ops.length) {
      throw new Error(
        `Malformed Vapor op stream at offset ${cursor} (opcode ${String(code)})`,
      );
    }
    if (code === OP.SET_EVENT) {
      events.push({
        eventType: ops[cursor + 2],
        eventName: ops[cursor + 3],
        sign: ops[cursor + 4],
      });
    }
    cursor += arity + 1;
  }
  return events;
}

describe("built Vapor IFR bundle", () => {
  test(
    "paints on MT, hydrates without duplication, and transfers ownership to BG",
    async () => {
      const { bundle, url } = await loadIfrBundle();
      const hostGlobals = captureDescriptors();
      const jsdom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
      let env;

      try {
        env = new LynxTestingEnv(jsdom);
        globalThis.lynxTestingEnv = env;

        // The constructor leaves BG active. Capture this realm before any MT
        // module can install Vapor DOM classes, uid-bearing ShadowElements,
        // IFR bridges, or the event sign registry on the shared Node global.
        const backgroundRealm = captureDescriptors(VAPOR_REALM_GLOBALS);
        const backgroundBatches = [];
        const nativeApp = env.backgroundThread.globalThis.lynx.getNativeApp();
        const callLepusMethod = nativeApp.callLepusMethod;
        nativeApp.callLepusMethod = (method, params, callback) => {
          if (method === "vuePatchUpdate") {
            backgroundBatches.push(JSON.parse(params.data));
          }
          return callLepusMethod(method, params, callback);
        };

        const nativeEvents = [];
        const addEvent = env.mainThread.globalThis.__AddEvent;
        env.mainThread.globalThis.__AddEvent = (
          element,
          eventType,
          eventName,
          handler,
        ) => {
          if (handler !== undefined) {
            nativeEvents.push({ eventType, eventName, sign: handler });
          }
          return addEvent(element, eventType, eventName, handler);
        };

        env.switchToMainThread();
        // On Lynx for Web the Lepus chunk executes on the page's main
        // thread, where real DOM globals exist. Reproduce that hostile realm
        // for the MT evaluation: the Vapor runtime must classify
        // ShadowElements through its own shims (via the plugin's identifier
        // rewrite), not through whatever host DOM happens to be present.
        // These land in the MT snapshot only; `restoreDescriptors(
        // backgroundRealm)` below removes them before the BG evaluation,
        // matching the DOM-less background Worker.
        globalThis.document = jsdom.window.document;
        globalThis.window = jsdom.window;
        for (const ctor of [
          "Node",
          "Element",
          "Text",
          "Comment",
          "CharacterData",
          "DocumentFragment",
          "HTMLElement",
          "SVGElement",
          "HTMLSlotElement",
        ]) {
          globalThis[ctor] = jsdom.window[ctor];
        }
        new vm.Script(`(function(){${bundle.lepusCode.root}\n})()`, {
          filename: fileURLToPath(url),
        }).runInThisContext();
        globalThis.renderPage(globalThis.processData({}));

        const pageAfterMt = jsdom.window.document.body.firstElementChild;
        expect(pageAfterMt?.tagName.toLowerCase()).toBe("page");
        const mtDescendantCount = pageAfterMt.querySelectorAll("*").length;
        expect(mtDescendantCount).toBeGreaterThan(0);
        expect(jsdom.window.document.body.children).toHaveLength(1);

        const mtHtml = normalizeHtml(jsdom.window.document.body.innerHTML);
        const scopeTokens = new Set(mtHtml.match(/data-v-[a-f0-9]+/g) ?? []);
        expect(scopeTokens.size).toBeGreaterThanOrEqual(2);
        expect(pageAfterMt.querySelector("view.page")?.className).toMatch(
          /data-v-[a-f0-9]+/,
        );
        expect(pageAfterMt.querySelector("view.counter")?.className).toMatch(
          /data-v-[a-f0-9]+/,
        );

        const mtEvents = nativeEvents.map(({ eventType, eventName, sign }) => ({
          eventType,
          eventName,
          sign,
        }));
        expect(mtEvents.length).toBeGreaterThan(0);

        env.switchToBackgroundThread();
        restoreDescriptors(backgroundRealm);
        new vm.Script(
          `(function(){${bundle.manifest["/app-service.js"]}\n})()`,
          { filename: `${fileURLToPath(url)}#background` },
        ).runInThisContext();
        await Promise.resolve();

        expect(backgroundBatches.length).toBeGreaterThan(0);
        const bgEvents = backgroundBatches.flatMap(eventFrames);
        expect(bgEvents).toEqual(mtEvents);
        // Equal signs are reconciled rather than registering duplicate native
        // listeners during hydration.
        expect(nativeEvents).toHaveLength(mtEvents.length);

        env.switchToMainThread();
        const pageAfterBg = jsdom.window.document.body.firstElementChild;
        expect(jsdom.window.document.body.children).toHaveLength(1);
        expect(pageAfterBg.querySelectorAll("*")).toHaveLength(
          mtDescendantCount,
        );
        expect(normalizeHtml(jsdom.window.document.body.innerHTML)).toBe(mtHtml);

        // Dispatch while BG globals are active, as native Lynx does. The plus
        // handler must resolve through the freshly restored BG sign registry;
        // the resulting reactive update then crosses back through
        // vuePatchUpdate, proving ownership moved to BG after hydration.
        const increment = [...pageAfterBg.querySelectorAll("view.button")].at(-1);
        expect(increment).toBeDefined();
        env.switchToBackgroundThread();
        increment.dispatchEvent(
          new jsdom.window.Event("bindEvent:tap", { bubbles: true }),
        );
        await Promise.resolve();
        env.switchToMainThread();
        expect(
          jsdom.window.document.querySelector("text.count")?.textContent,
        ).toBe("1");
        expect(jsdom.window.document.querySelector("view.history")).not.toBeNull();
      } finally {
        restoreHostGlobals(hostGlobals);
        jsdom.window.close();
      }
    },
    120_000,
  );
});
