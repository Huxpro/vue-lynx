import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadManifest } from "./manifest.mjs";

const textExtensions = new Set([
  ".css",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
  ".vue",
]);

export function transformModule(source) {
  return source.replace(/(from\s*|import\s*\()['"]vue-lynx['"]/g, (match) =>
    match.replace("vue-lynx", "vue-lynx/vapor-app")
  );
}

export function transformSFC(source) {
  if (/<script(?!\s+setup\b)[^>]*>[\s\S]*?export\s+default\b/.test(source)) {
    throw new Error("Options API SFCs are not supported by Vapor overlays");
  }

  return transformModule(
    source.replace(/<script\s+setup(?![^>]*\bvapor\b)/g, "<script setup vapor")
  );
}

export async function copyOverlayFile(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  if (!textExtensions.has(extname(source))) {
    await cp(source, destination);
    return;
  }

  const contents = await readFile(source, "utf8");
  await writeFile(
    destination,
    extname(source) === ".vue"
      ? transformSFC(contents)
      : transformModule(contents)
  );
}

async function copyTree(source, destination) {
  for (const item of await readdir(source, { withFileTypes: true })) {
    const sourcePath = join(source, item.name);
    const destinationPath = join(destination, item.name);
    if (item.isDirectory()) {
      await copyTree(sourcePath, destinationPath);
    } else if (item.isFile()) {
      await copyOverlayFile(sourcePath, destinationPath);
    }
  }
}

function extractObjectRange(source, property, from = 0) {
  const match = new RegExp(`\\b${property}\\s*:\\s*\\{`, "g");
  match.lastIndex = from;
  const result = match.exec(source);
  if (!result) throw new Error(`Could not find ${property} object`);
  const opening = source.indexOf("{", result.index);
  let depth = 0;
  for (let index = opening; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return { opening, closing: index };
  }
  throw new Error(`Unclosed ${property} object`);
}

function makeGeneratedConfig(source, entries) {
  const sourceRange = extractObjectRange(source, "source");
  const entryRange = extractObjectRange(source, "entry", sourceRange.opening);
  const indentation = "      ";
  const entrySource = entries
    .map(
      ({ name, path }) =>
        `${indentation}${JSON.stringify(name)}: ${JSON.stringify(path)},`
    )
    .join("\n");
  let generated = `${source.slice(
    0,
    entryRange.opening + 1
  )}\n${entrySource}\n    ${source.slice(entryRange.closing)}`;

  generated = generated.replace(/\/dist\//g, "/dist-vapor/");
  generated = generated.replace(
    /output\s*:\s*\{/,
    "output: {\n    distPath: { root: 'dist-vapor' },"
  );
  if (!/\bvapor\s*:\s*true/.test(generated)) {
    generated = generated.replace(
      /pluginVueLynx\s*\(\s*\{/,
      "pluginVueLynx({\n      vapor: true,"
    );
  }
  return generated;
}

export async function generateVaporOverlay(root, example) {
  const rootPath = fileURLToPath(root);
  const examplePath = join(rootPath, "examples", example);
  const generatedPath = join(examplePath, ".vapor-generated");
  const sourcePath = join(examplePath, "src");
  const destinationPath = join(generatedPath, "src");
  await rm(generatedPath, { recursive: true, force: true });
  await mkdir(destinationPath, { recursive: true });
  await copyTree(sourcePath, destinationPath);

  const manifest = await loadManifest(root);
  const entries = manifest.entries
    .filter(
      ({ id, vapor }) =>
        id.startsWith(`${example}/`) && vapor.disposition !== "unsupported"
    )
    .map(({ id, entry, vapor }) => ({
      name: id.slice(example.length + 1),
      path: `./.vapor-generated/${(vapor.vaporEntry ?? entry).replace(
        /^\.\//,
        ""
      )}`,
    }));

  const configPath = join(examplePath, "lynx.vapor.generated.config.ts");
  const configSource = await readFile(
    join(examplePath, "lynx.config.ts"),
    "utf8"
  );
  await writeFile(configPath, makeGeneratedConfig(configSource, entries));

  return { configPath, generatedPath, entries };
}
