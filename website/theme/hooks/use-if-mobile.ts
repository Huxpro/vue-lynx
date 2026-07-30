import { useEffect, useState } from 'react';

/**
 * Detect whether the current browser is a mobile device.
 */
export default function useIfMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIfMobile = (): void => {
      const userAgentCheck = (): boolean => {
        if (typeof navigator === 'undefined') return false;
        const ua = navigator.userAgent;
        return (
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            ua,
          ) ||
          (/Tablet|iPad/i.test(ua) && !/Trident/i.test(ua))
        );
      };

      const screenCheck = (): boolean => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth < 768;
      };

      setIsMobile(userAgentCheck() || screenCheck());
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return isMobile;
}
