import type React from 'react';
import { PhoneFrame, PhoneGo } from './PhoneFrame';
import {
  DESIGN,
  DESIGN_TO_PREVIEW_SCALE,
  FRAME,
  PREVIEW,
  VIDEO_CAPTURE,
  VIDEO_DPR,
  VIDEO_TO_PREVIEW_SCALE,
} from './phone-frame';
import styles from './index.module.scss';

type ComparePair = {
  title: string;
  /** CDN recording (same files the homepage used to embed). */
  video: string;
  /** Local still extracted from the recording — always visible for density check. */
  poster: string;
  example: string;
  defaultFile: string;
  defaultEntryName: string;
  entry: string;
};

/**
 * Side-by-side video vs live web — used to verify that fit@360×804 into the
 * phone bezel matches the density of the original showcase recordings.
 */
const pairs: ComparePair[] = [
  {
    title: 'Gallery (ifr.mp4)',
    video:
      'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/assets/killers/ifr.mp4',
    poster: '/media/showcase-scale/ifr-poster.jpg',
    example: 'gallery',
    defaultFile: 'src/GalleryComplete/Gallery.vue',
    defaultEntryName: 'GalleryComplete',
    entry: 'src/GalleryComplete',
  },
  {
    title: 'Swiper (mts.mp4)',
    video:
      'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/assets/killers/mts.mp4',
    poster: '/media/showcase-scale/mts-poster.jpg',
    example: 'swiper',
    defaultFile: 'src/Swiper/Swiper.vue',
    defaultEntryName: 'Swiper',
    entry: 'src/Swiper',
  },
];

function SpecBlock() {
  const lines = [
    `video capture:     ${VIDEO_CAPTURE.width} × ${VIDEO_CAPTURE.height}  (= ${DESIGN.width} × ${DESIGN.height} CSS-px @${VIDEO_DPR}×)`,
    `design canvas:     ${DESIGN.width} × ${DESIGN.height}  (rpx unit = designWidth/750 = ${(DESIGN.width / 750).toFixed(3)}px)`,
    `preview (inner):   ${PREVIEW.width} × ${PREVIEW.height}`,
    `frame (outer):     ${FRAME.width} × ${FRAME.height}`,
    `video → preview:   scale ${(VIDEO_TO_PREVIEW_SCALE * 100).toFixed(2)}%  (object-fit: cover)`,
    `design → preview:  scale ${(DESIGN_TO_PREVIEW_SCALE * 100).toFixed(2)}%  (go-web fit/cover)`,
    `note: design = capture / ${VIDEO_DPR} so video cover and live fit share the same logical size`,
  ];
  return <pre className={styles['scale-compare-spec']}>{lines.join('\n')}</pre>;
}

export const ScaleCompare: React.FC = () => {
  return (
    <div className={styles['scale-compare']}>
      <SpecBlock />
      {pairs.map((pair) => (
        <div className={styles['scale-compare-row']} key={pair.example}>
          <div className={styles['scale-compare-row-title']}>{pair.title}</div>
          <div className={styles['scale-compare-pair']}>
            <div className={styles['scale-compare-cell']}>
              <div className={styles['scale-compare-label']}>Video</div>
              <PhoneFrame>
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster={pair.poster}
                  preload="metadata"
                >
                  <source src={pair.video} type="video/mp4" />
                </video>
              </PhoneFrame>
            </div>
            <div className={styles['scale-compare-cell']}>
              <div className={styles['scale-compare-label']}>
                Live web (fit @ {DESIGN.width}×{DESIGN.height})
              </div>
              <PhoneGo
                example={pair.example}
                defaultFile={pair.defaultFile}
                defaultEntryName={pair.defaultEntryName}
                entry={pair.entry}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScaleCompare;
