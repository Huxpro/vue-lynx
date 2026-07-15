// =============================================================================
// Magic move (FLIP) — elements tagged with the same data-flip id on two
// adjacent slides morph between their positions/sizes, Keynote-style.
// Everything else uses the normal slide transition. Factory takes the deck
// element + a getScale() (from the stage) so a scaled stage stays accurate.
// =============================================================================

const FLIP_MS = 640;
const FLIP_EASE = 'cubic-bezier(0.34, 0.9, 0.25, 1)';

function collectFlips(slide) {
  const map = new Map();
  slide.querySelectorAll('[data-flip]').forEach((el) => {
    map.set(el.getAttribute('data-flip'), el);
  });
  return map;
}

export function createMagicMove({ deck, getScale, reducedMotion = false, embed = false }) {
  let flipCleanup = null;

  function magicMove(fromSlide, toSlide) {
    if (reducedMotion || embed || !fromSlide || !toSlide) return false;
    if (deck.classList.contains('overview')) return false;

    const fromMap = collectFlips(fromSlide);
    const pairs = [];
    toSlide.querySelectorAll('[data-flip]').forEach((toEl) => {
      const fromEl = fromMap.get(toEl.getAttribute('data-flip'));
      if (fromEl) pairs.push({ fromEl, toEl });
    });
    if (pairs.length === 0) return false;

    // Finish any in-flight morph before starting a new one.
    if (flipCleanup) flipCleanup();

    // 1. Source rects (fromSlide is still at rest this frame).
    pairs.forEach((p) => { p.fromRect = p.fromEl.getBoundingClientRect(); });

    // 2. Pin both slides so geometry is final (no enter/exit transform drift).
    fromSlide.classList.add('is-morphing-out');
    toSlide.classList.add('is-morphing-in');

    // 3. Destination rects (toSlide now pinned to its final layout).
    pairs.forEach((p) => { p.toRect = p.toEl.getBoundingClientRect(); });

    // 4. Invert — place each target element over its source, no transition.
    //    Rects are in scaled viewport px; divide the translation by the stage
    //    scale so it maps to the element's own (unscaled) coordinate space.
    const s = (getScale?.() || 1);
    pairs.forEach((p) => {
      const { fromRect, toRect, toEl } = p;
      const dx = (fromRect.left - toRect.left) / s;
      const dy = (fromRect.top - toRect.top) / s;
      const sx = toRect.width ? fromRect.width / toRect.width : 1;
      const sy = toRect.height ? fromRect.height / toRect.height : 1;
      toEl.classList.add('is-flipping');
      // FLIP contract: an element keeps its OWN positioning scheme while
      // morphing. We only need a positioned box (for z-index), so promote
      // static elements to relative via inline style — never via the class,
      // which would yank absolutely-positioned elements (logos, diagram
      // blocks, thread lanes) into flow mid-morph: they'd tween from a wrong
      // origin, then snap into place at cleanup.
      const cs = getComputedStyle(toEl);
      if (cs.position === 'static') {
        toEl.style.position = 'relative';
        p.promoted = true;
      }
      // Same contract for transforms: elements may carry their OWN transform
      // (e.g. .fb's translate(-50%,-50%) centering). The FLIP delta must
      // COMPOSE with it, not replace it — replacing shifts the element by
      // half its size for the whole morph, then snaps at cleanup. Both rects
      // were measured with the own transform applied, so prepending the
      // delta and releasing back to the own matrix is exact.
      p.own = cs.transform === 'none' ? '' : cs.transform;
      toEl.style.transformOrigin = 'top left';
      toEl.style.transition = 'none';
      toEl.style.transform =
        `translate(${dx}px, ${dy}px) scale(${sx || 1}, ${sy || 1})` +
        (p.own ? ` ${p.own}` : '');
    });

    // 5. Play — release to the (own) identity transform on the next frame.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        pairs.forEach(({ toEl, own }) => {
          toEl.style.transition = `transform ${FLIP_MS}ms ${FLIP_EASE}`;
          toEl.style.transform =
            `translate(0, 0) scale(1, 1)${own ? ` ${own}` : ''}`;
        });
      });
    });

    // 6. Cleanup.
    const cleanup = () => {
      clearTimeout(timer);
      pairs.forEach(({ toEl, promoted }) => {
        toEl.classList.remove('is-flipping');
        toEl.style.transform = '';
        toEl.style.transition = '';
        toEl.style.transformOrigin = '';
        if (promoted) toEl.style.position = '';
      });
      fromSlide.classList.remove('is-morphing-out');
      toSlide.classList.remove('is-morphing-in');
      flipCleanup = null;
    };
    const timer = setTimeout(cleanup, FLIP_MS + 120);
    flipCleanup = cleanup;
    return true;
  }

  // Finalize any in-flight morph — call before changing slides so a fast
  // navigation can't leave a morphing slide pinned visible (is-morphing-in).
  function finish() { if (flipCleanup) flipCleanup(); }

  return { magicMove, finish };
}
