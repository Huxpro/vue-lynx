import { useEffect, useRef } from 'react';
import { Go as GoBase, GoConfigProvider } from '@lynx-js/go-web';
import type { GoProps } from '@lynx-js/go-web';
import { rspressAdapter } from '@lynx-js/go-web/adapters/rspress';
import { attachAutoGesture } from './attach-auto-gesture';
import type { AutoGestureOptions } from './auto-gesture';

const config = {
  exampleBasePath: '/examples',
  defaultTab: 'web' as const,
  ...rspressAdapter,
};

type Props = GoProps & {
  /**
   * Demonstrate a gesture-driven example with simulated touches once its web
   * preview has painted. A carousel that binds `touchstart`/`touchmove`/
   * `touchend` shows nothing to a desktop reader otherwise — a mouse never
   * produces those events, so the preview reads as a still image.
   *
   * This wraps the preview and drives the `<lynx-view>` from outside, because
   * the published `@lynx-js/go-web` has no prop for it yet. See
   * `attach-auto-gesture.ts`.
   */
  autoGesture?: AutoGestureOptions;
};

export function Go({ autoGesture, ...props }: Props) {
  const host = useRef<HTMLDivElement>(null);
  // Read through a ref so an inline options object does not restart playback
  // on every render of the surrounding page.
  const options = useRef(autoGesture);
  options.current = autoGesture;
  useEffect(() => {
    if (!host.current || !options.current) return;
    return attachAutoGesture(host.current, options.current);
  }, []);

  return (
    <GoConfigProvider config={config}>
      {autoGesture ? (
        <div ref={host}>
          <GoBase {...props} />
        </div>
      ) : (
        <GoBase {...props} />
      )}
    </GoConfigProvider>
  );
}

export type { GoProps };
export default Go;
