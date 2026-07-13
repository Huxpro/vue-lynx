import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { startStaticServer } from "../src/web-server.mjs";

describe("static example server", () => {
  test("serves WebAssembly with the MIME type required by compileStreaming", async () => {
    const root = await mkdtemp(join(tmpdir(), "vue-lynx-web-server-"));
    await writeFile(join(root, "runtime.wasm"), Buffer.from([0, 97, 115, 109]));
    const server = await startStaticServer(root);

    try {
      const response = await fetch(`${server.origin}/runtime.wasm`);
      expect(response.headers.get("content-type")).toBe("application/wasm");
    } finally {
      await server.close();
    }
  });
});
