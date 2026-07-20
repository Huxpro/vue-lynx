import type React from 'react';
import { Go } from '../../go/Go';
import type { GoProps } from '../../go/Go';
import { FRAME, GO_PHONE_PROPS, PREVIEW } from './phone-frame';
import styles from './index.module.scss';

type PhoneFrameProps = {
  children?: React.ReactNode;
  className?: string;
};

/** Shared bezel used by the homepage showcase and the scale-compare page. */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={[styles['mobile-show-frame'], className].filter(Boolean).join(' ')}
      style={{
        width: FRAME.width,
        height: FRAME.height,
      }}
    >
      <div
        className={styles['preview']}
        style={{
          width: PREVIEW.width,
          height: PREVIEW.height,
        }}
      >
        {children}
      </div>
    </div>
  );
}

type PhoneGoProps = Omit<
  GoProps,
  'mode' | 'defaultTab' | 'webPreviewMode' | 'designWidth' | 'designHeight' | 'fit'
> & {
  example: string;
};

/** Live Lynx embed laid out at the 375×838 design canvas, scaled into the bezel. */
export function PhoneGo(props: PhoneGoProps) {
  return (
    <PhoneFrame>
      <Go {...GO_PHONE_PROPS} {...props} />
    </PhoneFrame>
  );
}
