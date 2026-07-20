import type React from 'react';
import { PhoneFrame, PhoneGo } from './PhoneFrame';
import {
  DESIGN,
  DESIGN_TO_PREVIEW_SCALE,
  FRAME,
  PREVIEW,
  VIDEO_CAPTURE,
  VIDEO_TO_PREVIEW_SCALE,
} from './phone-frame';
import styles from './index.module.scss';

type ComparePair = {
  title: string;
  video: string;
  example: string;
  defaultFile: string;
  defaultEntryName: string;
  entry: string;
};

/**
 * Side-by-side video vs live web — used to verify that fit@375 into the
 * phone bezel matches the density of the original showcase recordings.
 */
const pairs: ComparePair[] = [
  {
    title: 'Gallery (ifr.mp4)',
    video:
      'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/assets/killers/ifr.mp4',
    example: 'gallery',
    defaultFile: 'src/GalleryComplete/Gallery.vue',
    defaultEntryName: 'GalleryComplete',
    entry: 'src/GalleryComplete',
  },
  {
    title: 'Swiper (mts.mp4)',
    video:
      'https://lf-lynx.tiktok-cdns.com/obj/lynx-artifacts-oss-sg/lynx-website/assets/killers/mts.mp4',
    example: 'swiper',
    defaultFile: 'src/Swiper/Swiper.vue',
    defaultEntryName: 'Swiper',
    entry: 'src/Swiper',
  },
];

function SpecBlock() {
  const lines = [
    `video capture:     ${VIDEO_CAPTURE.width} × ${VIDEO_CAPTURE.height}`,
    `design canvas:     ${DESIGN.width} × ${DESIGN.height}  (375 CSS-px ≈ 750 rpx @2×)`,
    `preview (inner):   ${PREVIEW.width} × ${PREVIEW.height}`,
    `frame (outer):     ${FRAME.width} × ${FRAME.height}`,
    `video → preview:   scale ${(VIDEO_TO_PREVIEW_SCALE * 100).toFixed(2)}%  (object-fit: cover)`,
    `design → preview:  scale ${(DESIGN_TO_PREVIEW_SCALE * 100).toFixed(2)}%  (go-web fit/cover)`,
    `note: design height = 375 × (2412/1080) so cover ≈ contain (near-zero crop)`,
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
                <video autoPlay loop muted playsInline>
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
