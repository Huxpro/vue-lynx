import type { DefineComponent } from 'vue';
import type { IntrinsicElements } from '@lynx-js/types'

type ExtractBindAsOn<T> = {
  [P in keyof T as P extends `bind${infer Rest}` ? `on${Capitalize<Rest>}` : never]: T[P]
}

type NonBindProps<T> = Omit<T, `bind${string}` | 'className'>

/**
 * Vue-compatible class binding type.
 * @see https://vuejs.org/guide/essentials/class-and-style
 */
export type VueClassBinding =
  | string
  | Record<string, unknown>
  | (VueClassBinding | false | null | undefined)[]

/**
 * Maps Lynx intrinsic element props to Vue-friendly props:
 *
 * - Converts `bindXxx` props to Vue-style `onXxx` event handlers.
 * - Removes the React-style `className` alias (Lynx carries both; Vue only
 *   needs `class`).
 * - Widens `class` from `string` to the full {@link VueClassBinding} union so
 *   that array-syntax and object-syntax `:class` bindings pass TypeScript
 *   without errors.
 */
export type VueLynxProps<T> =
  ExtractBindAsOn<T> &
  Omit<NonBindProps<T>, 'class'> &
  { class?: VueClassBinding }

type VueLynxComponent<T> = DefineComponent<VueLynxProps<T>>

export type VueLynxElements = {
  [K in keyof IntrinsicElements]: VueLynxComponent<IntrinsicElements[K]>
}

declare module "vue" {
  export interface GlobalComponents extends VueLynxElements {}
}
