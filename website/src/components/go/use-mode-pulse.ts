import { useEffect, useRef, useState } from 'react';

import type { RenderMode } from './render-mode-store';

/**
 * True for ~700ms after `mode` changes (not on mount). Drives the gradient
 * ring pulse that shows which page elements responded to a renderer switch.
 */
export function useModePulse(mode: RenderMode): boolean {
  const [pulse, setPulse] = useState(false);
  const previous = useRef(mode);

  useEffect(() => {
    if (previous.current === mode) return;
    previous.current = mode;
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 700);
    return () => clearTimeout(timer);
  }, [mode]);

  return pulse;
}
