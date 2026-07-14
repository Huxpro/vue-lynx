import { PNG } from "pngjs";
import { describe, expect, test } from "vitest";

import { comparePngBuffers } from "../src/visual-diff.mjs";

function image(width, height, paint = () => [255, 255, 255, 255]) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const [red, green, blue, alpha] = paint(x, y);
      png.data[offset] = red;
      png.data[offset + 1] = green;
      png.data[offset + 2] = blue;
      png.data[offset + 3] = alpha;
    }
  }
  return PNG.sync.write(png);
}

describe("visual PNG parity", () => {
  test("accepts identical renderings", () => {
    const screenshot = image(10, 10);

    const result = comparePngBuffers(screenshot, screenshot);

    expect(result).toMatchObject({
      matches: true,
      diffPixels: 0,
      diffRatio: 0,
      width: 10,
      height: 10,
    });
    expect(PNG.sync.read(result.diffBuffer)).toMatchObject({
      width: 10,
      height: 10,
    });
  });

  test("rejects a layout-sized changed region", () => {
    const vdom = image(10, 10);
    const vapor = image(10, 10, (x, y) =>
      x < 5 && y < 4 ? [0, 0, 0, 255] : [255, 255, 255, 255],
    );

    const result = comparePngBuffers(vdom, vapor, {
      threshold: 0.1,
      maxDiffRatio: 0.001,
    });

    expect(result.matches).toBe(false);
    expect(result.diffPixels).toBe(20);
    expect(result.diffRatio).toBeCloseTo(0.2);
  });

  test("rejects screenshots with different dimensions", () => {
    expect(() => comparePngBuffers(image(10, 10), image(11, 10))).toThrow(
      "Screenshot dimensions differ",
    );
  });
});
