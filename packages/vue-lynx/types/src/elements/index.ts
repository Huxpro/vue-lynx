import type { DefineComponent } from "vue";
import type {IntrinsicElements} from '@lynx-js/types'

type ExtractBindAsOn<T> = {
  [P in keyof T as P extends `bind${infer Rest}` ? `on${Capitalize<Rest>}` : never]: T[P]
}

type NonBindProps<T> = Omit<T, `bind${string}` | 'className'>

type VueLynxProps<T> = ExtractBindAsOn<T> & NonBindProps<T>

type VueLynxComponent<T> = DefineComponent<VueLynxProps<T>>

export type VueLynxElements = {
  [K in keyof IntrinsicElements]: VueLynxComponent<IntrinsicElements[K]>
}

declare module "vue" {
  export interface GlobalComponents extends VueLynxElements {}
}
