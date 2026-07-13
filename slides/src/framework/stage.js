// =============================================================================
// Stage — the fixed 16:9 canvas. Slides are authored against a baseW×baseH
// design space (the `.frame`, a CSS size container) and this scales the frame
// to fit the viewport, preserving aspect on any screen. getScale() is read by
// the magic-move engine so FLIP deltas (measured in scaled viewport px) map
// back to the element's own (unscaled) coordinate space.
// =============================================================================

export function createStage(frame, { baseW = 1280, baseH = 720 } = {}) {
  let scale = 1;
  function fit() {
    if (!frame) return;
    scale = Math.min(window.innerWidth / baseW, window.innerHeight / baseH);
    frame.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
  fit();
  window.addEventListener('resize', fit);
  return { fit, getScale: () => scale };
}
