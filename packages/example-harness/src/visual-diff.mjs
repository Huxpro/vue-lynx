import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export const DEFAULT_VISUAL_THRESHOLD = 0.1;
export const DEFAULT_MAX_DIFF_RATIO = 0.001;

export function comparePngBuffers(
  vdomBuffer,
  vaporBuffer,
  {
    threshold = DEFAULT_VISUAL_THRESHOLD,
    maxDiffRatio = DEFAULT_MAX_DIFF_RATIO,
  } = {},
) {
  const vdom = PNG.sync.read(vdomBuffer);
  const vapor = PNG.sync.read(vaporBuffer);
  if (vdom.width !== vapor.width || vdom.height !== vapor.height) {
    throw new Error(
      `Screenshot dimensions differ: VDOM ${vdom.width}x${vdom.height}, Vapor ${vapor.width}x${vapor.height}`,
    );
  }

  const diff = new PNG({ width: vdom.width, height: vdom.height });
  const diffPixels = pixelmatch(
    vdom.data,
    vapor.data,
    diff.data,
    vdom.width,
    vdom.height,
    { threshold },
  );
  const totalPixels = vdom.width * vdom.height;
  const diffRatio = totalPixels === 0 ? 0 : diffPixels / totalPixels;

  return {
    matches: diffRatio <= maxDiffRatio,
    diffPixels,
    diffRatio,
    totalPixels,
    width: vdom.width,
    height: vdom.height,
    diffBuffer: PNG.sync.write(diff),
  };
}
