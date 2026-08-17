import { useEffect } from 'react';

const DEFAULT_MAX_DEGREE = 6;

/**
 * Adds a 3D tilt effect on mouse hover to elements matching the given selector.
 * Skipped on mobile devices.
 */
export function useTiltEffect(
  selector: string,
  { maxDegree = DEFAULT_MAX_DEGREE, isMobile = false } = {},
) {
  useEffect(() => {
    if (isMobile) return;

    const items = document.querySelectorAll<HTMLElement>(selector);

    const handleMouseMove = (e: MouseEvent, item: HTMLElement) => {
      const rect = item.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      const rotateX = -y * maxDegree;
      const rotateY = x * maxDegree;
      item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = (item: HTMLElement) => {
      item.style.transform = 'none';
    };

    const handlers = new Map<
      HTMLElement,
      { move: (e: Event) => void; leave: () => void }
    >();

    items.forEach((item) => {
      const move = (e: Event) => handleMouseMove(e as MouseEvent, item);
      const leave = () => handleMouseLeave(item);
      item.addEventListener('mousemove', move);
      item.addEventListener('mouseleave', leave);
      handlers.set(item, { move, leave });
    });

    return () => {
      handlers.forEach(({ move, leave }, item) => {
        item.removeEventListener('mousemove', move);
        item.removeEventListener('mouseleave', leave);
      });
    };
  }, [selector, maxDegree, isMobile]);
}
