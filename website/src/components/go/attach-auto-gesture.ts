// Attach the gesture driver to whatever `<Go>` ends up rendering.
//
// `<Go>` owns its `<lynx-view>` and does not hand it out, so this watches for
// one to appear underneath a container we do control. Once the published
// `@lynx-js/go-web` accepts an `autoGesture` prop (lynx-community/go-web#79),
// this file and its vendored `auto-gesture.ts` can both go away.

import { playAutoGesture } from './auto-gesture';
import type { AutoGestureOptions, AutoGestureHandle } from './auto-gesture';

/**
 * How often to look for a preview to drive.
 *
 * `<Go>` lazy-loads the preview, web-core builds the page asynchronously after
 * that, and a refresh replaces the page root — so there is no single event to
 * listen for, and a `MutationObserver` would need one per shadow root anyway.
 * Polling covers appearance, painting and refresh with one mechanism, and at
 * this interval it costs a `querySelector` every few frames.
 */
const POLL_MS = 400;

/**
 * Play `options` on the first `<lynx-view>` under `root`, once it has painted
 * and while it is on screen.
 *
 * Returns a cleanup that stops playback. Safe to call before the preview
 * exists; it will pick it up when it does.
 */
export function attachAutoGesture(
  root: HTMLElement,
  options: AutoGestureOptions,
): () => void {
  let playback: AutoGestureHandle | null = null;
  let view: HTMLElement | null = null;
  let painted: Element | null = null;
  let onScreen = false;
  // The page root the current playback belongs to. A refresh builds a new one
  // beside the old, so identity is what says "this is a different page" — and
  // comparing against it is what keeps a reader who touched the preview from
  // having the demonstration restart under their finger.
  let playingFor: Element | null = null;

  // A tutorial page carries a preview per step, and the driver aims its
  // contacts with `document.elementFromPoint` — which is viewport-relative and
  // returns nothing for an element scrolled off screen. Without this gate every
  // preview below the fold starts a playback that silently hits nothing, and
  // the reader arrives to find it already "running" and motionless.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) onScreen = entry.isIntersecting;
      sync();
    },
    { threshold: 0.5 },
  );

  function sync(): void {
    if (onScreen && painted && view) {
      if (playingFor === painted) return;
      playback?.stop();
      playingFor = painted;
      playback = playAutoGesture(view, options);
      return;
    }
    // Off screen: stop, and let a later scroll back start it again.
    playback?.stop();
    playback = null;
    playingFor = null;
  }

  const timer = setInterval(() => {
    const found = root.querySelector('lynx-view');
    if (found !== view) {
      if (view) observer.unobserve(view);
      view = found as HTMLElement | null;
      if (view) observer.observe(view);
    }
    painted =
      view?.shadowRoot?.querySelector('[part="page"]:not([l-disposed])') ??
      null;
    sync();
  }, POLL_MS);

  return () => {
    clearInterval(timer);
    observer.disconnect();
    playback?.stop();
    playback = null;
  };
}
