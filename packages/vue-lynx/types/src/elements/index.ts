import type { DefineComponent } from 'vue';
import type { IntrinsicElements } from '@lynx-js/types'

type ExtractBindAsOn<T> = {
  [P in keyof T as P extends `bind${infer Rest}` ? `on${Capitalize<Rest>}` : never]: T[P]
}

type NonBindProps<T> = Omit<T, `bind${string}` | 'className'>

/**
 * Vue-compatible class binding type.
 *
 * In Vue 3, `:class` accepts a string, an array of strings/objects, or a
 * record of `{ [className]: boolean }`. The underlying Lynx `StandardProps`
 * interface types `class` as a plain `string` because that is what the native
 * engine ultimately receives. However, restricting the prop to `string` at the
 * Vue template level would break the standard Vue idioms that every developer
 * expects to work:
 *
 * ```vue
 * <!-- All three forms should be accepted without a TypeScript error -->
 * <view :class="isActive ? 'active' : 'idle'" />
 * <view :class="['base', isActive && 'active']" />
 * <view :class="{ active: isActive, 'text-sm': small }" />
 * ```
 *
 * Vue's runtime-core normalises any of these shapes into a single space-joined
 * string before calling `patchProp`, so the native engine always receives a
 * plain string regardless of which form the template uses. Widening the type
 * here is therefore safe and restores the idiomatic Vue developer experience.
 */
type VueClassBinding =
  | string
  | Record<string, boolean | undefined | null>
  | (string | Record<string, boolean | undefined | null> | false | null | undefined)[]

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
type VueLynxProps<T> =
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
