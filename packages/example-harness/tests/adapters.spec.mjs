import { readFile } from "node:fs/promises";

import { describe, expect, test } from "vitest";

const root = new URL("../../..", import.meta.url);

function source(path) {
  return readFile(new URL(path, root), "utf8");
}

describe("Vapor example adapters", () => {
  test.each([
    ["ImageCard", "ImageCard"],
    ["LikeCard", "LikeImageCard"],
  ])(
    "renders gallery %s through a template component",
    async (name, component) => {
      const contents = await source(
        `examples/gallery/src/vapor-adapters/${name}.vue`
      );

      expect(contents).toContain(`<${component}`);
      expect(contents).toContain("furnituresPicturesSubArray[0]");
      expect(contents).toContain("gallery-wrapper single-card");
    }
  );

  test.each(["Swiper", "SwiperEmpty", "SwiperMTS"])(
    "renders %s through Page default slot",
    async (name) => {
      const contents = await source(
        `examples/swiper/src/vapor-adapters/${name}.vue`
      );

      expect(contents).toContain("<Page>");
      expect(contents).toContain(
        `<${name === "Swiper" ? "Swiper" : "SwiperComponent"}`
      );
      expect(contents).toContain(':data="picsArr"');
    }
  );

  test("keeps networking static styles in a shared module", async () => {
    const app = await source("examples/networking/src/App.vue");
    const styles = await source("examples/networking/src/styles.ts");

    expect(app).toMatch(/import \{ styles \} from ["']\.\/styles["']/);
    expect(app.match(/<script/g)).toHaveLength(1);
    expect(styles).toContain("export const styles = {");
  });
});
