import type React from 'react';
import { useRef, useEffect } from 'react';
import styles from './index.module.scss';

interface BorderBeamProps {
  color?: string;
  size?: number;
  duration?: number;
}

const BorderBeam: React.FC<BorderBeamProps> = ({
  size = 2,
  duration = 3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    });
    resizeObserver.observe(container);

    const { width: initW, height: initH } = container.getBoundingClientRect();
    canvas.width = initW;
    canvas.height = initH;

    let animationFrameId: number;
    const startTime = performance.now();

    const getCoordinatesFromDistance = (distance: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const perimeter = 2 * (width + height);
      distance = distance % perimeter;

      if (distance < width) return { x: distance, y: 0 };
      if (distance < width + height) return { x: width, y: distance - width };
      if (distance < 2 * width + height) return { x: width - (distance - (width + height)), y: height };
      return { x: 0, y: height - (distance - (2 * width + height)) };
    };

    const drawPathSegment = (start: number, end: number) => {
      let current = start;
      const currentPoint = getCoordinatesFromDistance(current);
      ctx.moveTo(currentPoint.x, currentPoint.y);
      while (current < end) {
        current += 1;
        const point = getCoordinatesFromDistance(current);
        ctx.lineTo(point.x, point.y);
      }
    };

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = (elapsed % duration) / duration;
      const width = canvas.width;
      const height = canvas.height;
      const perimeter = 2 * (width + height);
      const beamLength = perimeter * 0.05;

      ctx.clearRect(0, 0, width, height);

      const positionStart = progress * perimeter;
      const positionEnd = (positionStart + beamLength) % perimeter;

      const startCoord = getCoordinatesFromDistance(positionStart);
      const endCoord = getCoordinatesFromDistance(positionEnd);
      const gradient = ctx.createLinearGradient(startCoord.x, startCoord.y, endCoord.x, endCoord.y);

      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.2, 'rgba(66, 184, 131, 0.3)');
      gradient.addColorStop(0.5, '#42b883');
      gradient.addColorStop(0.8, '#42b883');
      gradient.addColorStop(0.9, '#00ddff');
      gradient.addColorStop(1, 'transparent');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = size;
      ctx.beginPath();

      if (positionEnd < positionStart) {
        drawPathSegment(positionStart, perimeter);
        drawPathSegment(0, positionEnd);
      } else {
        drawPathSegment(positionStart, positionEnd);
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [size, duration]);

  return (
    <div ref={containerRef} className={styles['border-beam-frame']}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
    </div>
  );
};

export { BorderBeam };
