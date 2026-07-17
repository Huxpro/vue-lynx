import { useEffect, useRef } from 'react';

import styles from './index.module.scss';

interface TechniqueVideoProps {
  src: string;
  poster: string;
  label: string;
  caption: string;
}

export function TechniqueVideo({ src, poster, label, caption }: TechniqueVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isIntersecting = false;

    const syncPlayback = () => {
      if (reducedMotion.matches || !isIntersecting) {
        video.pause();
        return;
      }

      void video.play().catch(() => {
        // Browsers may still require an explicit play gesture.
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.55 },
    );

    observer.observe(video);
    reducedMotion.addEventListener('change', syncPlayback);

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', syncPlayback);
    };
  }, []);

  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <video
          ref={videoRef}
          className={styles.video}
          src={src}
          poster={poster}
          aria-label={label}
          muted
          loop
          playsInline
          controls
          preload="metadata"
        />
      </div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}

export default TechniqueVideo;
