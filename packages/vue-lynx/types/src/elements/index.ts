import type { DefineComponent } from 'vue';
import type { IntrinsicElements } from '@lynx-js/types';

type ExtractBindAsOn<T> = {
  [P in keyof T as P extends `bind${infer Rest}` ? `on${Capitalize<Rest>}` : never]: T[P]
}

type NonBindProps<T> = Omit<
  T,
  | `bind${string}`
  | 'className'
  | `main-thread:${string}`
  | `global-bind:${string}`
  | `global-catch:${string}`
>

/**
 * Vue-compatible class binding type.
 * @see https://vuejs.org/guide/essentials/class-and-style
 */
type VueClassBinding =
  | string
  | Record<string, unknown>
  | (VueClassBinding | false | null | undefined)[]

type MainThreadRefLike = {
  readonly _wvid: number;
  toJSON(): unknown;
}

type LynxEventHandler = ((...args: never[]) => unknown) | undefined

type StringKeyOf<T> = Extract<keyof T, string>

type Camelize<S extends string> = S extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<Camelize<Tail>>}`
  : S

type BindEventSuffix<T> =
  Extract<StringKeyOf<T>, `bind${string}`> extends `bind${infer S}` ? S : never

type CatchEventSuffix<T> =
  Extract<StringKeyOf<T>, `catch${string}`> extends `catch${infer S}` ? S : never

type PropValue<T, K extends string> = K extends keyof T ? T[K] : LynxEventHandler

type LynxGlobalEventSourceProps<T> = {
  [K in BindEventSuffix<T> as `global-bind${K}`]?: PropValue<T, `bind${K}`>
} & {
  [K in CatchEventSuffix<T> as `global-catch${K}`]?: PropValue<T, `catch${K}`>
}

type LynxGlobalEventCamelProps<T> = {
  [K in keyof LynxGlobalEventSourceProps<T> & string as Camelize<K>]?:
    LynxGlobalEventSourceProps<T>[K]
}

type LynxMainThreadEventKey<T> =
  | Extract<StringKeyOf<T>, `bind${string}` | `catch${string}` | `global-bind${string}`>
  | keyof LynxGlobalEventSourceProps<T> & string

type LynxMainThreadEventProps<T> = {
  [K in LynxMainThreadEventKey<T> as `main-thread-${K}`]?: unknown
} & {
  [K in LynxMainThreadEventKey<T> as Camelize<`main-thread-${K}`>]?: unknown
}

type LynxSpecialProps<T> = {
  // kebab-case (source) and camelCase (Volar-normalised) forms are both needed.
  'main-thread-ref'?: MainThreadRefLike | null;
  mainThreadRef?: MainThreadRefLike | null;
} & LynxGlobalEventSourceProps<T> &
  LynxGlobalEventCamelProps<T> &
  LynxMainThreadEventProps<T>

/**
 * Maps Lynx intrinsic element props to Vue-friendly props:
 *
 * - Converts `bindXxx` props to Vue-style `onXxx` event handlers.
 * - Removes the React-style `className` alias (Lynx carries both; Vue only
 *   needs `class`).
 * - Widens `class` from `string` to the full {@link VueClassBinding} union so
 *   that array-syntax and object-syntax `:class` bindings pass TypeScript
 *   without errors.
 * - Adds Vue Lynx special props for global events and main-thread worklets.
 */
export type VueLynxProps<T> =
  ExtractBindAsOn<T> &
  Omit<NonBindProps<T>, 'class'> &
  { class?: VueClassBinding } &
  LynxSpecialProps<T>

type VueLynxComponent<T> = DefineComponent<VueLynxProps<T>>

export type VueLynxElements = {
  [K in keyof IntrinsicElements]: VueLynxComponent<IntrinsicElements[K]>
}

declare module "vue" {
  export interface GlobalComponents extends VueLynxElements {}
}
