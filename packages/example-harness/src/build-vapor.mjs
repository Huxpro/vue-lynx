import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadManifest } from "./manifest.mjs";
import { generateVaporOverlay } from "./vapor-overlay.mjs";

function run(command, arguments_, options) {
  return new Promise((resolve) => {
    const child = spawn(command, arguments_, {
      ...options,
      env: { ...process.env, NODE_ENV: "production", FORCE_COLOR: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (options.echo) process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (options.echo) process.stderr.write(chunk);
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

export async function buildVaporExample(root, example, options = {}) {
  const rootPath = fileURLToPath(root);
  const examplePath = join(rootPath, "examples", example);
  const outputPath = join(examplePath, "dist-vapor");
  await rm(outputPath, { recursive: true, force: true });

  try {
    const overlay = await generateVaporOverlay(root, example);
    if (overlay.entries.length === 0) {
      return { example, ok: true, skipped: true, entries: [] };
    }
    const execution = await run(
      "pnpm",
      ["exec", "rspeedy", "build", "--config", overlay.configPath],
      { cwd: examplePath, echo: options.echo }
    );
    return {
      example,
      ok: execution.code === 0,
      skipped: false,
      entries: overlay.entries.map(({ name }) => name),
      ...execution,
    };
  } catch (error) {
    return {
      example,
      ok: false,
      skipped: false,
      entries: [],
      code: 1,
      stdout: "",
      stderr: error.stack ?? String(error),
    };
  }
}

export async function buildAllVaporExamples(root, options = {}) {
  const manifest = await loadManifest(root);
  const examples = [
    ...new Set(
      manifest.entries
        .filter(({ vapor }) => vapor.disposition !== "unsupported")
        .map(({ id }) => id.split("/")[0])
    ),
  ].sort();
  const results = [];
  for (const example of examples) {
    console.info(`\n[Vapor build] ${example}`);
    const result = await buildVaporExample(root, example, {
      ...options,
      echo: true,
    });
    results.push(result);
    console.info(result.ok ? `[PASS] ${example}` : `[FAIL] ${example}`);
  }

  const artifacts = join(fileURLToPath(root), "artifacts", "example-harness");
  await mkdir(artifacts, { recursive: true });
  await writeFile(
    join(artifacts, "build-vapor.json"),
    `${JSON.stringify(results, null, 2)}\n`
  );
  return results;
}

async function main() {
  const root = new URL("../../..", import.meta.url);
  const arguments_ = process.argv.slice(2);
  const exampleIndex = arguments_.indexOf("--example");
  const example = exampleIndex === -1 ? null : arguments_[exampleIndex + 1];
  const results = example
    ? [await buildVaporExample(root, example, { echo: true })]
    : await buildAllVaporExamples(root);

  if (results.some(({ ok }) => !ok)) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
