import { useCallback, useEffect, useRef } from 'react';

interface DotPatternProps {
  className?: string;
}

export function DotPattern({ className }: DotPatternProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const doDraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const dotSize = 1;
    const spacing = 20;
    const color = 'rgba(156, 163, 175, 0.7)';

    for (let x = 0; x < rect.width; x += spacing) {
      for (let y = 0; y < rect.height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
  }, []);

  useEffect(() => {
    doDraw();
    window.addEventListener('resize', doDraw);
    return () => {
      window.removeEventListener('resize', doDraw);
    };
  }, [doDraw]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }}
    />
  );
}
