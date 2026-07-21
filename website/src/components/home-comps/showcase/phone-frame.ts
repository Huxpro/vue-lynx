/**
 * Homepage phone-frame geometry, derived from the original showcase
 * recordings (ifr.mp4 / mts.mp4):
 *
 *   capture: 1080 × 2412  (= 360 × 804 CSS-px @3×)
 *   aspect:  1080 / 2412 ≈ 0.4478
 *
 * Layout at that logical size via go-web `webPreviewMode="fit"`, then scale
 * into the bezel. 360 matches the recording; go-web's `--rpx-unit` is still
 * `designWidth / 750` (Lynx's 750-wide rpx baseline).
 */

/** Capture resolution of the original gallery / swiper showcase videos. */
export const VIDEO_CAPTURE = { width: 1080, height: 2412 } as const;

/** Device pixel ratio implied by the recordings (1080/360 = 2412/804 = 3). */
export const VIDEO_DPR = 3;

/** Logical phone canvas used by go-web `webPreviewMode="fit"`. */
export const DESIGN = {
  width: VIDEO_CAPTURE.width / VIDEO_DPR, // 360
  height: VIDEO_CAPTURE.height / VIDEO_DPR, // 804
} as const;

/**
 * Inner preview size (inside the 5px bezel padding).
 * Slightly larger than the original 260×580 so three live apps breathe a
 * bit more; still scrollable when we grow to six cards on narrow viewports.
 */
export const PREVIEW = {
  width: 280,
  height: Math.round((280 * VIDEO_CAPTURE.height) / VIDEO_CAPTURE.width),
} as const;

/** Outer phone chrome = preview + 5px padding on each side. */
export const FRAME = {
  width: PREVIEW.width + 10,
  height: PREVIEW.height + 10,
  padding: 5,
  radius: 26,
  previewRadius: 22,
} as const;

/** Scale of the design canvas into the preview (cover ≈ contain here). */
export const DESIGN_TO_PREVIEW_SCALE = PREVIEW.width / DESIGN.width;

/** Scale of the video capture into the preview (object-fit: cover). */
export const VIDEO_TO_PREVIEW_SCALE = PREVIEW.width / VIDEO_CAPTURE.width;

export const GO_PHONE_PROPS = {
  mode: 'preview' as const,
  defaultTab: 'web' as const,
  webPreviewMode: 'fit' as const,
  designWidth: DESIGN.width,
  designHeight: DESIGN.height,
  fit: 'cover' as const,
};
