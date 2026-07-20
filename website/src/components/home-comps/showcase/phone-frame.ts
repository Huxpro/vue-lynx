/**
 * Homepage phone-frame geometry, derived from the original showcase
 * recordings (ifr.mp4 / mts.mp4):
 *
 *   capture: 1080 × 2412
 *   aspect:  1080 / 2412 ≈ 0.4478
 *
 * Lynx / go-web layout at a 375 CSS-px design width (750 rpx @2×), with
 * height matched to the recording aspect so `fit: cover` ≈ `fit: contain`
 * (almost no crop) — the same density the videos had when `object-fit: cover`
 * into the old 260×580 bezel (scale ≈ 260/1080 of the capture, ≈ 260/375 of
 * logical CSS).
 */

/** Capture resolution of the original gallery / swiper showcase videos. */
export const VIDEO_CAPTURE = { width: 1080, height: 2412 } as const;

/** Logical phone canvas used by go-web `webPreviewMode="fit"`. */
export const DESIGN = {
  width: 375,
  /** 375 × (2412 / 1080) */
  height: Math.round((375 * VIDEO_CAPTURE.height) / VIDEO_CAPTURE.width),
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
