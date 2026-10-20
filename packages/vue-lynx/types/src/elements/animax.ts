import type { BaseEvent, StandardProps } from '@lynx-js/types';

/**
 * Props and events of the `<animax-view>` element: the AnimaX player
 * (Lottie plus alpha video) shipped with Lynx's xelement set on iOS and
 * Android and as `@lynx-js/animax` on the web.
 *
 * Attribute names, defaults and event names follow the native element
 * (`LynxUIAnimaX` and `UIAnimaX`) and the web custom element, so a template
 * written once drives all three.
 */

/** Payload every playback event carries. */
export interface AnimaXParam {
  /** Unique id of the composition instance. */
  animationID: string;
  /** Frame the player is on. */
  current: number;
  /** Total frame count. */
  total: number;
  /** Loop index, from zero. */
  loopIndex: number;
}

export interface AnimaXFpsParam extends AnimaXParam {
  fps: number;
  max_drop_rate: number;
}

export interface AnimaXTapParam extends AnimaXParam {
  /** Layer names under the tap, when `taplayers` events are enabled. */
  layerList: string[];
}

export interface AnimaXErrorParam {
  code: number;
  /** The native element reports `message`; the web element reports `data`. */
  message?: string;
  data?: string;
}

export type AnimaXEvent<D> = BaseEvent<string, D>;

export type AnimaXObjectFit =
  | 'contain'
  | 'cover'
  | 'center'
  | 'fill'
  | 'scale-down';

export type AnimaXObjectPosition =
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface AnimaXViewProps extends StandardProps {
  /** URL of a Lottie JSON or an AFX export (zip). */
  src?: string;
  /** Inline Lottie JSON, as a string. */
  json?: string;
  /** Format hint for `src` when the URL does not say. */
  'src-format'?: string;
  /** Resource name to URL overrides for images, fonts and videos. */
  'src-polyfill'?: Record<string, string>;
  /** @defaultValue true */
  autoplay?: boolean;
  /** @defaultValue false */
  loop?: boolean;
  /** Loops to play when `loop` is false; the native default is 1. */
  'loop-count'?: number;
  /** Playback rate; 1 is the composition's own. */
  speed?: number;
  /** Jump to a point of the composition, 0 to 1. */
  progress?: number;
  'start-frame'?: number;
  /** -1 plays to the last frame. */
  'end-frame'?: number;
  'auto-reverse'?: boolean;
  /** Keep the last frame on screen after completion. @defaultValue true */
  keeplastframe?: boolean;
  objectfit?: AnimaXObjectFit;
  'object-position'?: AnimaXObjectPosition;
  /** Milliseconds between `fps` events; unset means none. */
  'fps-event-interval'?: number;
  'max-frame-rate'?: number;
  /** Load image, font and video resources lazily by name. */
  'dynamic-resource'?: boolean;
  'anti-aliasing'?: string;
  /** Mute the composition's audio layers. @defaultValue false */
  muted?: boolean;
  /** @defaultValue false */
  'enable-audio'?: boolean;
  /** Native only: draw into an image, a surface, or let the engine choose. */
  'display-mode'?: 'image' | 'surface' | 'auto';
  /** Native only. @defaultValue true */
  'multi-thread-accelerate'?: boolean;
  /** Native only: keep playing while detached from the window. */
  'ignore-attach-status'?: boolean;
  /** Native only: keep playing while the LynxView is in the background. */
  'ignore-lynx-lifecycle'?: boolean;
  /** Native only: a label for the engine's own reporting. */
  tag?: string;

  bindready?: (e: AnimaXEvent<AnimaXParam>) => void;
  bindstart?: (e: AnimaXEvent<AnimaXParam>) => void;
  bindrepeat?: (e: AnimaXEvent<AnimaXParam>) => void;
  bindupdate?: (e: AnimaXEvent<AnimaXParam>) => void;
  bindcompletion?: (e: AnimaXEvent<AnimaXParam>) => void;
  bindcancel?: (e: AnimaXEvent<AnimaXParam>) => void;
  bindfirstframe?: (e: AnimaXEvent<AnimaXParam>) => void;
  bindcompositionready?: (e: AnimaXEvent<AnimaXParam>) => void;
  bindfps?: (e: AnimaXEvent<AnimaXFpsParam>) => void;
  bindtaplayers?: (e: AnimaXEvent<AnimaXTapParam>) => void;
  binderror?: (e: AnimaXEvent<AnimaXErrorParam>) => void;
  bindwarning?: (e: AnimaXEvent<AnimaXErrorParam>) => void;
}
