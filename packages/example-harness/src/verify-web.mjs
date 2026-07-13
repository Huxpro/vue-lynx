import { execFileSync } from "node:child_process";
import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

import { loadManifest } from "./manifest.mjs";
import { scenarios } from "./scenarios.mjs";
import { startStaticServer } from "./web-server.mjs";

const chromeCandidates = [
  process.env.CHROME_PATH,
  chromium.executablePath(),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

export function isActionableRequestFailure(errorText) {
  return errorText !== "net::ERR_ABORTED";
}

export function selectAllShortcut(platform = process.platform) {
  return platform === "darwin" ? "Meta+A" : "Control+A";
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolveChromeExecutable() {
  for (const candidate of chromeCandidates) {
    if (await exists(candidate)) return candidate;
  }
  throw new Error(
    `No Chromium executable found. Checked: ${chromeCandidates.join(", ")}`,
  );
}

async function prepareWebsite(rootPath) {
  const output = join(rootPath, "website", "doc_build", "__example-harness.html");
  execFileSync("pnpm", ["--dir", "website", "prepare-examples"], {
    cwd: rootPath,
    stdio: "inherit",
  });
  if (!(await exists(output))) {
    execFileSync("pnpm", ["--dir", "website", "build"], {
      cwd: rootPath,
      stdio: "inherit",
    });
  } else {
    const source = join(rootPath, "website", "docs", "public", "examples");
    const destination = join(rootPath, "website", "doc_build", "examples");
    await rm(destination, { recursive: true, force: true });
    await cp(source, destination, { recursive: true });
  }
}

async function installFixtures(page) {
  await page.route("**/jsonplaceholder.typicode.com/**", async (route) => {
    const url = route.request().url();
    const body = url.includes("/posts")
      ? [
          { userId: 1, id: 1, title: "fixture post", body: "fixture body" },
          { userId: 1, id: 2, title: "second post", body: "second body" },
        ]
      : [
          {
            id: 1,
            name: "Leanne Graham",
            email: "leanne@example.test",
            company: { name: "Romaguera-Crona" },
          },
        ];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.route("**/node-hnapi.herokuapp.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 1,
          title: "Fixture story",
          points: 1,
          user: "vue-lynx",
          time_ago: "now",
          comments_count: 0,
          url: "https://example.test/story",
          domain: "example.test",
        },
      ]),
    });
  });
}

function deepDomHelpers() {
  const page = document
    .querySelector("lynx-view")
    ?.shadowRoot?.querySelector('[part="page"]');
  if (!page) return [];
  const roots = [page];
  const elements = [page];
  for (const root of roots) {
    for (const element of root.querySelectorAll("*")) {
      elements.push(element);
      if (element.shadowRoot) roots.push(element.shadowRoot);
    }
  }
  return elements;
}

async function snapshot(page) {
  return page.evaluate((helperSource) => {
    const elements = (0, eval)(`(${helperSource})`)();
    const text = elements
      .map((element) => element.textContent ?? "")
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    return {
      elementCount: elements.length,
      inputValues: elements
        .filter((element) => element.tagName === "INPUT")
        .map((element) => element.value),
      text: text.slice(0, 10_000),
    };
  }, deepDomHelpers.toString());
}

async function tapText(page, text) {
  const box = await page.evaluate(
    ({ helperSource, text }) => {
      const elements = (0, eval)(`(${helperSource})`)();
      const candidates = elements.filter((element) =>
        (element.textContent ?? "").toLowerCase().includes(text.toLowerCase()),
      );
      const exactCandidates = candidates.filter(
        (element) =>
          (element.textContent ?? "").trim().toLowerCase() === text.trim().toLowerCase(),
      );
      const element = (exactCandidates.length > 0 ? exactCandidates : candidates)
        .filter((candidate) =>
          ![...candidate.children].some((child) =>
            (child.textContent ?? "").toLowerCase().includes(text.toLowerCase()),
          ),
        )
        .at(-1);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    },
    { helperSource: deepDomHelpers.toString(), text },
  );
  if (!box) throw new Error(`Could not find tappable text: ${text}`);
  await page.mouse.click(box.x, box.y);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function fillInput(page, action) {
  const box = await page.evaluate(
    ({ helperSource, placeholder, index }) => {
      const elements = (0, eval)(`(${helperSource})`)();
      const inputs = elements.filter((candidate) => candidate.tagName === "INPUT");
      const element = Number.isInteger(index)
        ? inputs[index]
        : inputs.find((candidate) =>
            (candidate.getAttribute?.("placeholder") ?? "")
              .toLowerCase()
              .includes(placeholder.toLowerCase()),
          );
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    },
    {
      helperSource: deepDomHelpers.toString(),
      placeholder: action.placeholder ?? "",
      index: action.index,
    },
  );
  if (!box) throw new Error(`Could not find input: ${action.placeholder}`);
  await page.mouse.click(box.x, box.y);
  await page.keyboard.press(selectAllShortcut());
  await page.keyboard.type(action.value);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function runScenario(page, scenario) {
  const before = await snapshot(page);
  for (const action of scenario.actions) {
    if (action.kind === "tap-text") await tapText(page, action.text);
    if (action.kind === "input") await fillInput(page, action);
  }
  const after = await snapshot(page);
  for (const assertion of scenario.assertions) {
    if (assertion.kind === "rendered-tree" && after.elementCount < assertion.minNodes) {
      throw new Error(`Rendered ${after.elementCount} elements; expected at least ${assertion.minNodes}`);
    }
    if (
      assertion.kind === "text"
      && !after.text.toLowerCase().includes(assertion.includes.toLowerCase())
    ) {
      throw new Error(`Missing text ${JSON.stringify(assertion.includes)} in ${after.text.slice(0, 500)}`);
    }
    if (
      assertion.kind === "input-value"
      && after.inputValues[assertion.index] !== assertion.equals
    ) {
      throw new Error(
        `Input ${assertion.index} was ${JSON.stringify(after.inputValues[assertion.index])}; expected ${JSON.stringify(assertion.equals)}`,
      );
    }
  }
  const signature = scenario.assertions.map((assertion) => {
    if (assertion.kind === "rendered-tree") return "rendered";
    if (assertion.kind === "text") return `text:${assertion.includes.toLowerCase()}`;
    if (assertion.kind === "input-value") {
      return `input:${assertion.index}:${after.inputValues[assertion.index]}`;
    }
    return assertion.kind;
  });
  return { before, after, signature };
}

async function verifyEntry(browser, origin, row, mode, artifacts) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    const text = message.text();
    if (
      message.type() === "error"
      && !text.startsWith("NYI: profileStart")
      && !text.startsWith("NYI: profileEnd")
    ) {
      errors.push(`console: ${text}`);
    }
  });
  page.on("pageerror", (error) =>
    errors.push(`pageerror: ${error.stack ?? error.message ?? String(error)}`),
  );
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText ?? "unknown";
    if (isActionableRequestFailure(errorText)) {
      errors.push(`requestfailed: ${request.url()} (${errorText})`);
    }
  });
  await installFixtures(page);
  const [example, name] = row.id.split("/");
  const directory = mode === "vapor" ? "dist-vapor" : "dist";
  const bundle = `/examples/${example}/${directory}/${name}.web.bundle`;

  try {
    await page.goto(
      `${origin}/__example-harness?bundle=${encodeURIComponent(bundle)}`,
      { waitUntil: "domcontentloaded" },
    );
    await page.waitForFunction(
      () => {
        const harness = window.__VUE_LYNX_EXAMPLE_HARNESS__;
        return Boolean(harness && harness.status !== "loading");
      },
      null,
      { timeout: 20_000 },
    );
    const harness = await page.evaluate(() => window.__VUE_LYNX_EXAMPLE_HARNESS__);
    if (harness?.status !== "ready") throw new Error(harness?.error ?? "Harness did not become ready");
    await page.waitForFunction(
      () =>
        Boolean(
          document
            .querySelector("lynx-view")
            ?.shadowRoot?.querySelector('[part="page"] > *'),
        ),
      null,
      { timeout: 20_000 },
    );
    const checkpoints = await runScenario(page, scenarios[row.scenario]);
    if (errors.length > 0) throw new Error(errors.join("\n"));
    return { id: row.id, mode, ok: true, bundle, checkpoints };
  } catch (error) {
    const safeId = row.id.replaceAll("/", "__");
    await page.screenshot({ path: join(artifacts, `${safeId}__${mode}.png`), fullPage: true });
    return { id: row.id, mode, ok: false, bundle, error: error.stack ?? String(error), errors };
  } finally {
    await context.close();
  }
}

async function verifyWebsiteModeControl(browser, origin, artifacts) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    const value = message.text();
    if (message.type() === "error" && !value.startsWith("NYI: profile")) {
      errors.push(`console: ${value}`);
    }
  });
  page.on("pageerror", (error) =>
    errors.push(`pageerror: ${error.stack ?? error.message ?? String(error)}`),
  );

  try {
    await page.goto(`${origin}/guide/quick-start`, { waitUntil: "domcontentloaded" });
    const status = page.locator(".vapor-status").first();
    await status.waitFor({ timeout: 20_000 });
    const vaporRequest = page.waitForRequest(
      (request) => request.url().includes("/examples/hello-world/dist-vapor/main.web.bundle"),
      { timeout: 20_000 },
    );
    await status.getByRole("button", { name: "Vapor" }).click();
    const request = await vaporRequest;
    await page
      .locator('.vapor-status button[aria-pressed="true"]')
      .filter({ hasText: "Vapor" })
      .waitFor({ timeout: 20_000 });
    await page.waitForFunction(
      () =>
        Boolean(
          document
            .querySelector("lynx-view")
            ?.shadowRoot?.querySelector('[part="page"] > *'),
        ),
      null,
      { timeout: 20_000 },
    );
    if (errors.length > 0) throw new Error(errors.join("\n"));
    return {
      id: "website/go-toggle",
      mode: "website",
      ok: true,
      bundle: request.url(),
    };
  } catch (error) {
    await page.screenshot({
      path: join(artifacts, "website__go-toggle.png"),
      fullPage: true,
    });
    return {
      id: "website/go-toggle",
      mode: "website",
      ok: false,
      error: error.stack ?? String(error),
      errors,
    };
  } finally {
    await context.close();
  }
}

export async function verifyWeb(root, { mode = "all", entry } = {}) {
  const rootPath = fileURLToPath(root);
  await prepareWebsite(rootPath);
  const artifacts = join(rootPath, "artifacts", "example-harness");
  await mkdir(artifacts, { recursive: true });
  const server = await startStaticServer(join(rootPath, "website", "doc_build"));
  const browser = await chromium.launch({
    headless: true,
    executablePath: await resolveChromeExecutable(),
  });
  const manifest = await loadManifest(root);
  const requestedEntries = entry ? new Set(entry.split(",")) : null;
  const rows = manifest.entries.filter((row) => !requestedEntries || requestedEntries.has(row.id));
  const modes = mode === "all" ? ["vdom", "vapor"] : [mode];
  const results = [];

  try {
    for (const currentMode of modes) {
      for (const row of rows) {
        if (currentMode === "vapor" && row.vapor.disposition === "unsupported") continue;
        process.stdout.write(`[Web ${currentMode}] ${row.id} ... `);
        const result = await verifyEntry(browser, server.origin, row, currentMode, artifacts);
        results.push(result);
        process.stdout.write(result.ok ? "PASS\n" : "FAIL\n");
      }
    }
    if (mode === "all") {
      for (const row of rows.filter(({ vapor }) => vapor.disposition !== "unsupported")) {
        const vdom = results.find((result) => result.id === row.id && result.mode === "vdom");
        const vapor = results.find((result) => result.id === row.id && result.mode === "vapor");
        if (!vdom?.ok || !vapor?.ok) continue;
        if (
          JSON.stringify(vdom.checkpoints.signature)
          !== JSON.stringify(vapor.checkpoints.signature)
        ) {
          vapor.ok = false;
          vapor.error = `Parity mismatch: ${JSON.stringify({
            vdom: vdom.checkpoints.signature,
            vapor: vapor.checkpoints.signature,
          })}`;
        }
      }
      if (!entry) {
        process.stdout.write("[Web website] VDOM/Vapor toggle ... ");
        const result = await verifyWebsiteModeControl(browser, server.origin, artifacts);
        results.push(result);
        process.stdout.write(result.ok ? "PASS\n" : "FAIL\n");
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  await writeFile(join(artifacts, `web-${mode}.json`), `${JSON.stringify(results, null, 2)}\n`);
  return results;
}

async function main() {
  const arguments_ = process.argv.slice(2);
  const valueAfter = (flag) => {
    const index = arguments_.indexOf(flag);
    return index === -1 ? undefined : arguments_[index + 1];
  };
  const results = await verifyWeb(new URL("../../..", import.meta.url), {
    mode: valueAfter("--mode") ?? "all",
    entry: valueAfter("--entry"),
  });
  if (results.some(({ ok }) => !ok)) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
