import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const contentTypes = {
  ".bundle": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
};

async function existingFile(root, pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const requested = join(root, clean);
  const candidates = [requested];
  if (!extname(requested)) candidates.push(`${requested}.html`, join(requested, "index.html"));

  for (const candidate of candidates) {
    try {
      await access(candidate);
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // Try the next clean-URL candidate.
    }
  }
  return null;
}

export async function startStaticServer(root) {
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const file = await existingFile(root, pathname === "/" ? "/index.html" : pathname);
    if (!file) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": contentTypes[extname(file)] ?? "application/octet-stream",
    });
    createReadStream(file).pipe(response);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
